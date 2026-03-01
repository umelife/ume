interface Step {
  label: string
  sublabel: string
}

const STEPS: Step[] = [
  { label: '1', sublabel: 'Intent' },
  { label: '2', sublabel: 'Heading' },
  { label: '3', sublabel: 'Arrived' },
  { label: '4', sublabel: 'QR Code' },
  { label: '5', sublabel: 'Done' },
]

type StepState = 'completed' | 'current' | 'pending'

interface Props {
  currentStep: 1 | 2 | 3 | 4 | 5
}

export default function StepBar({ currentStep }: Props) {
  function getState(stepNum: number): StepState {
    if (stepNum < currentStep) return 'completed'
    if (stepNum === currentStep) return 'current'
    return 'pending'
  }

  return (
    <div className="flex items-center justify-center px-4 py-3 bg-white border-b border-gray-100">
      {STEPS.map((step, index) => {
        const state = getState(index + 1)
        return (
          <div key={step.sublabel} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  state === 'completed'
                    ? 'bg-ume-indigo text-white'
                    : state === 'current'
                    ? 'bg-ume-indigo/10 border-2 border-ume-indigo text-ume-indigo animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {state === 'completed' ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.label
                )}
              </div>
              <span
                className={`text-[9px] mt-0.5 font-medium ${
                  state === 'pending' ? 'text-gray-300' : 'text-ume-indigo'
                }`}
              >
                {step.sublabel}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 md:w-10 mx-1 mb-4 transition-colors ${
                  index + 1 < currentStep ? 'bg-ume-indigo' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
