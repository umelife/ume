export interface College {
  slug: string
  name: string
  shortName: string
  city: string
  state: string
  stateCode: string
  students: number   // approx enrollment, for social proof copy
  domain?: string
}

export const COLLEGES: College[] = [
  { slug: 'university-of-the-cumberlands', name: 'University of the Cumberlands', shortName: 'UC', city: 'Williamsburg', state: 'Kentucky', stateCode: 'KY', students: 18000, domain: 'ucumberlands.edu' },
  { slug: 'university-of-texas-austin', name: 'University of Texas at Austin', shortName: 'UT Austin', city: 'Austin', state: 'Texas', stateCode: 'TX', students: 51000 },
  { slug: 'ohio-state-university', name: 'Ohio State University', shortName: 'Ohio State', city: 'Columbus', state: 'Ohio', stateCode: 'OH', students: 60000 },
  { slug: 'university-of-central-florida', name: 'University of Central Florida', shortName: 'UCF', city: 'Orlando', state: 'Florida', stateCode: 'FL', students: 68000 },
  { slug: 'texas-a-and-m-university', name: 'Texas A&M University', shortName: 'Texas A&M', city: 'College Station', state: 'Texas', stateCode: 'TX', students: 74000 },
  { slug: 'university-of-florida', name: 'University of Florida', shortName: 'UF', city: 'Gainesville', state: 'Florida', stateCode: 'FL', students: 55000 },
  { slug: 'arizona-state-university', name: 'Arizona State University', shortName: 'ASU', city: 'Tempe', state: 'Arizona', stateCode: 'AZ', students: 83000 },
  { slug: 'university-of-michigan', name: 'University of Michigan', shortName: 'U of M', city: 'Ann Arbor', state: 'Michigan', stateCode: 'MI', students: 47000 },
  { slug: 'university-of-minnesota', name: 'University of Minnesota', shortName: 'U of M', city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', students: 51000 },
  { slug: 'penn-state-university', name: 'Penn State University', shortName: 'Penn State', city: 'State College', state: 'Pennsylvania', stateCode: 'PA', students: 47000 },
  { slug: 'indiana-university', name: 'Indiana University Bloomington', shortName: 'IU', city: 'Bloomington', state: 'Indiana', stateCode: 'IN', students: 43000 },
  { slug: 'university-of-illinois-urbana-champaign', name: 'University of Illinois Urbana-Champaign', shortName: 'UIUC', city: 'Champaign', state: 'Illinois', stateCode: 'IL', students: 56000 },
  { slug: 'michigan-state-university', name: 'Michigan State University', shortName: 'MSU', city: 'East Lansing', state: 'Michigan', stateCode: 'MI', students: 50000 },
  { slug: 'university-of-washington', name: 'University of Washington', shortName: 'UW', city: 'Seattle', state: 'Washington', stateCode: 'WA', students: 48000 },
  { slug: 'university-of-georgia', name: 'University of Georgia', shortName: 'UGA', city: 'Athens', state: 'Georgia', stateCode: 'GA', students: 40000 },
  { slug: 'florida-state-university', name: 'Florida State University', shortName: 'FSU', city: 'Tallahassee', state: 'Florida', stateCode: 'FL', students: 44000 },
  { slug: 'purdue-university', name: 'Purdue University', shortName: 'Purdue', city: 'West Lafayette', state: 'Indiana', stateCode: 'IN', students: 50000 },
  { slug: 'rutgers-university', name: 'Rutgers University', shortName: 'Rutgers', city: 'New Brunswick', state: 'New Jersey', stateCode: 'NJ', students: 51000 },
  { slug: 'university-of-wisconsin-madison', name: 'University of Wisconsin-Madison', shortName: 'UW-Madison', city: 'Madison', state: 'Wisconsin', stateCode: 'WI', students: 47000 },
  { slug: 'university-of-arizona', name: 'University of Arizona', shortName: 'UA', city: 'Tucson', state: 'Arizona', stateCode: 'AZ', students: 46000 },
  { slug: 'nc-state-university', name: 'NC State University', shortName: 'NC State', city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', students: 36000 },
  { slug: 'university-of-north-carolina-chapel-hill', name: 'University of North Carolina at Chapel Hill', shortName: 'UNC', city: 'Chapel Hill', state: 'North Carolina', stateCode: 'NC', students: 30000 },
  { slug: 'university-of-virginia', name: 'University of Virginia', shortName: 'UVA', city: 'Charlottesville', state: 'Virginia', stateCode: 'VA', students: 25000 },
  { slug: 'virginia-tech', name: 'Virginia Tech', shortName: 'VT', city: 'Blacksburg', state: 'Virginia', stateCode: 'VA', students: 37000 },
  { slug: 'georgia-tech', name: 'Georgia Institute of Technology', shortName: 'Georgia Tech', city: 'Atlanta', state: 'Georgia', stateCode: 'GA', students: 21000 },
  { slug: 'university-of-california-los-angeles', name: 'University of California, Los Angeles', shortName: 'UCLA', city: 'Los Angeles', state: 'California', stateCode: 'CA', students: 46000 },
  { slug: 'university-of-california-berkeley', name: 'University of California, Berkeley', shortName: 'UC Berkeley', city: 'Berkeley', state: 'California', stateCode: 'CA', students: 44000 },
  { slug: 'university-of-california-san-diego', name: 'University of California, San Diego', shortName: 'UCSD', city: 'La Jolla', state: 'California', stateCode: 'CA', students: 42000 },
  { slug: 'university-of-southern-california', name: 'University of Southern California', shortName: 'USC', city: 'Los Angeles', state: 'California', stateCode: 'CA', students: 48000 },
  { slug: 'university-of-california-davis', name: 'University of California, Davis', shortName: 'UC Davis', city: 'Davis', state: 'California', stateCode: 'CA', students: 39000 },
  { slug: 'boston-university', name: 'Boston University', shortName: 'BU', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', students: 37000 },
  { slug: 'northeastern-university', name: 'Northeastern University', shortName: 'Northeastern', city: 'Boston', state: 'Massachusetts', stateCode: 'MA', students: 23000 },
  { slug: 'new-york-university', name: 'New York University', shortName: 'NYU', city: 'New York', state: 'New York', stateCode: 'NY', students: 58000 },
  { slug: 'columbia-university', name: 'Columbia University', shortName: 'Columbia', city: 'New York', state: 'New York', stateCode: 'NY', students: 32000 },
  { slug: 'cornell-university', name: 'Cornell University', shortName: 'Cornell', city: 'Ithaca', state: 'New York', stateCode: 'NY', students: 25000 },
  { slug: 'university-of-pittsburgh', name: 'University of Pittsburgh', shortName: 'Pitt', city: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA', students: 34000 },
  { slug: 'temple-university', name: 'Temple University', shortName: 'Temple', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', students: 37000 },
  { slug: 'drexel-university', name: 'Drexel University', shortName: 'Drexel', city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', students: 24000 },
  { slug: 'howard-university', name: 'Howard University', shortName: 'Howard', city: 'Washington', state: 'DC', stateCode: 'DC', students: 11000 },
  { slug: 'george-washington-university', name: 'George Washington University', shortName: 'GWU', city: 'Washington', state: 'DC', stateCode: 'DC', students: 26000 },
  { slug: 'university-of-maryland', name: 'University of Maryland', shortName: 'UMD', city: 'College Park', state: 'Maryland', stateCode: 'MD', students: 40000 },
  { slug: 'colorado-state-university', name: 'Colorado State University', shortName: 'CSU', city: 'Fort Collins', state: 'Colorado', stateCode: 'CO', students: 33000 },
  { slug: 'university-of-colorado-boulder', name: 'University of Colorado Boulder', shortName: 'CU Boulder', city: 'Boulder', state: 'Colorado', stateCode: 'CO', students: 35000 },
  { slug: 'university-of-utah', name: 'University of Utah', shortName: 'U of U', city: 'Salt Lake City', state: 'Utah', stateCode: 'UT', students: 33000 },
  { slug: 'university-of-tennessee', name: 'University of Tennessee Knoxville', shortName: 'UT', city: 'Knoxville', state: 'Tennessee', stateCode: 'TN', students: 35000 },
  { slug: 'vanderbilt-university', name: 'Vanderbilt University', shortName: 'Vandy', city: 'Nashville', state: 'Tennessee', stateCode: 'TN', students: 13000 },
  { slug: 'university-of-alabama', name: 'University of Alabama', shortName: 'UA', city: 'Tuscaloosa', state: 'Alabama', stateCode: 'AL', students: 38000 },
  { slug: 'auburn-university', name: 'Auburn University', shortName: 'Auburn', city: 'Auburn', state: 'Alabama', stateCode: 'AL', students: 31000 },
  { slug: 'louisiana-state-university', name: 'Louisiana State University', shortName: 'LSU', city: 'Baton Rouge', state: 'Louisiana', stateCode: 'LA', students: 34000 },
  { slug: 'university-of-miami', name: 'University of Miami', shortName: 'UM', city: 'Coral Gables', state: 'Florida', stateCode: 'FL', students: 19000 },
  { slug: 'university-of-south-florida', name: 'University of South Florida', shortName: 'USF', city: 'Tampa', state: 'Florida', stateCode: 'FL', students: 50000 },
  { slug: 'san-diego-state-university', name: 'San Diego State University', shortName: 'SDSU', city: 'San Diego', state: 'California', stateCode: 'CA', students: 37000 },
  { slug: 'california-state-university-long-beach', name: 'California State University, Long Beach', shortName: 'CSULB', city: 'Long Beach', state: 'California', stateCode: 'CA', students: 37000 },
  { slug: 'san-jose-state-university', name: 'San Jose State University', shortName: 'SJSU', city: 'San Jose', state: 'California', stateCode: 'CA', students: 35000 },
  { slug: 'university-of-oregon', name: 'University of Oregon', shortName: 'UO', city: 'Eugene', state: 'Oregon', stateCode: 'OR', students: 22000 },
  { slug: 'oregon-state-university', name: 'Oregon State University', shortName: 'OSU', city: 'Corvallis', state: 'Oregon', stateCode: 'OR', students: 31000 },
  { slug: 'university-of-nevada-las-vegas', name: 'University of Nevada, Las Vegas', shortName: 'UNLV', city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', students: 30000 },
  { slug: 'iowa-state-university', name: 'Iowa State University', shortName: 'ISU', city: 'Ames', state: 'Iowa', stateCode: 'IA', students: 31000 },
  { slug: 'university-of-iowa', name: 'University of Iowa', shortName: 'Iowa', city: 'Iowa City', state: 'Iowa', stateCode: 'IA', students: 31000 },
  { slug: 'university-of-kansas', name: 'University of Kansas', shortName: 'KU', city: 'Lawrence', state: 'Kansas', stateCode: 'KS', students: 27000 },
  { slug: 'kansas-state-university', name: 'Kansas State University', shortName: 'K-State', city: 'Manhattan', state: 'Kansas', stateCode: 'KS', students: 20000 },
  { slug: 'university-of-nebraska-lincoln', name: 'University of Nebraska-Lincoln', shortName: 'UNL', city: 'Lincoln', state: 'Nebraska', stateCode: 'NE', students: 25000 },
  { slug: 'university-of-oklahoma', name: 'University of Oklahoma', shortName: 'OU', city: 'Norman', state: 'Oklahoma', stateCode: 'OK', students: 28000 },
  { slug: 'oklahoma-state-university', name: 'Oklahoma State University', shortName: 'OSU', city: 'Stillwater', state: 'Oklahoma', stateCode: 'OK', students: 25000 },
  { slug: 'university-of-kentucky', name: 'University of Kentucky', shortName: 'UK', city: 'Lexington', state: 'Kentucky', stateCode: 'KY', students: 30000 },
  { slug: 'university-of-louisville', name: 'University of Louisville', shortName: 'UofL', city: 'Louisville', state: 'Kentucky', stateCode: 'KY', students: 23000 },
  { slug: 'west-virginia-university', name: 'West Virginia University', shortName: 'WVU', city: 'Morgantown', state: 'West Virginia', stateCode: 'WV', students: 26000 },
  { slug: 'university-of-mississippi', name: 'University of Mississippi', shortName: 'Ole Miss', city: 'Oxford', state: 'Mississippi', stateCode: 'MS', students: 22000 },
  { slug: 'mississippi-state-university', name: 'Mississippi State University', shortName: 'MSU', city: 'Starkville', state: 'Mississippi', stateCode: 'MS', students: 23000 },
  { slug: 'university-of-south-carolina', name: 'University of South Carolina', shortName: 'USC', city: 'Columbia', state: 'South Carolina', stateCode: 'SC', students: 35000 },
  { slug: 'clemson-university', name: 'Clemson University', shortName: 'Clemson', city: 'Clemson', state: 'South Carolina', stateCode: 'SC', students: 27000 },
]

export function getCollegeBySlug(slug: string): College | undefined {
  return COLLEGES.find(c => c.slug === slug)
}
