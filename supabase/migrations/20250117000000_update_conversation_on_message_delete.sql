-- ============================================================================
-- TRIGGER: Update Conversation Last Message on Message Delete/Update
-- ============================================================================
-- This migration adds a trigger to update the conversation's last_message_id
-- when a message is deleted or soft-deleted (deleted=true).
-- This ensures conversation previews always show the latest non-deleted message.

-- ============================================================================
-- FUNCTION: Update conversation last_message when message is deleted
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_on_message_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_participant_1 UUID;
  v_participant_2 UUID;
  v_latest_message RECORD;
BEGIN
  -- Determine which record to use (DELETE uses OLD, UPDATE uses NEW)
  DECLARE
    v_msg_listing_id UUID;
    v_msg_sender_id UUID;
    v_msg_receiver_id UUID;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_msg_listing_id := OLD.listing_id;
      v_msg_sender_id := OLD.sender_id;
      v_msg_receiver_id := OLD.receiver_id;
    ELSE -- UPDATE (soft delete: deleted=true)
      v_msg_listing_id := NEW.listing_id;
      v_msg_sender_id := NEW.sender_id;
      v_msg_receiver_id := NEW.receiver_id;
    END IF;

    -- Order participants consistently (lower UUID first)
    IF v_msg_sender_id < v_msg_receiver_id THEN
      v_participant_1 := v_msg_sender_id;
      v_participant_2 := v_msg_receiver_id;
    ELSE
      v_participant_1 := v_msg_receiver_id;
      v_participant_2 := v_msg_sender_id;
    END IF;

    -- Find the latest non-deleted message for this conversation
    SELECT id, created_at, body
    INTO v_latest_message
    FROM public.messages
    WHERE listing_id = v_msg_listing_id
      AND deleted = false
      AND ((sender_id = v_participant_1 AND receiver_id = v_participant_2)
        OR (sender_id = v_participant_2 AND receiver_id = v_participant_1))
    ORDER BY created_at DESC
    LIMIT 1;

    -- Update the conversation
    IF FOUND THEN
      -- Update with the latest non-deleted message
      UPDATE public.conversations
      SET
        last_message_id = v_latest_message.id,
        last_message_at = v_latest_message.created_at,
        updated_at = timezone('utc'::text, now())
      WHERE listing_id = v_msg_listing_id
        AND participant_1_id = v_participant_1
        AND participant_2_id = v_participant_2;
    ELSE
      -- No messages left - set last_message_id to NULL
      UPDATE public.conversations
      SET
        last_message_id = NULL,
        last_message_at = created_at, -- Keep original conversation creation time
        updated_at = timezone('utc'::text, now())
      WHERE listing_id = v_msg_listing_id
        AND participant_1_id = v_participant_1
        AND participant_2_id = v_participant_2;
    END IF;
  END;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Fire on DELETE (hard delete)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_delete ON public.messages;
CREATE TRIGGER trigger_update_conversation_on_message_delete
  AFTER DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message_delete();

-- ============================================================================
-- TRIGGER: Fire on UPDATE when deleted=true (soft delete)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_soft_delete ON public.messages;
CREATE TRIGGER trigger_update_conversation_on_message_soft_delete
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  WHEN (OLD.deleted = false AND NEW.deleted = true)
  EXECUTE FUNCTION update_conversation_on_message_delete();

-- ============================================================================
-- VERIFICATION QUERY (optional - run manually to test)
-- ============================================================================

-- To verify the trigger is working, run this query after deleting a message:
-- SELECT
--   c.id,
--   c.listing_id,
--   c.last_message_id,
--   m.body as last_message_body,
--   m.created_at as last_message_created_at
-- FROM public.conversations c
-- LEFT JOIN public.messages m ON m.id = c.last_message_id
-- WHERE c.participant_1_id = 'YOUR_USER_ID' OR c.participant_2_id = 'YOUR_USER_ID';

COMMENT ON FUNCTION update_conversation_on_message_delete() IS
  'Updates conversation last_message_id to the latest non-deleted message when a message is deleted';
