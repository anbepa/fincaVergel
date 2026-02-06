export const projects = [
  {
    id: 'thefarm',
    title: 'The Farm',
    path: '/thefarm',
    next: '/ourprocess',
    prev: '/our-staff' // Cycle back to last
  },
  {
    id: 'ourprocess',
    title: 'Our process',
    path: '/ourprocess',
    next: '/gettoknowus',
    prev: '/thefarm'
  },
  {
    id: 'gettoknowus',
    title: 'Get to know us',
    path: '/gettoknowus',
    next: '/perfectcoffee',
    prev: '/ourprocess'
  },
  {
    id: 'perfectcoffee',
    title: 'Perfect coffee',
    path: '/perfectcoffee',
    next: '/greenenergy',
    prev: '/gettoknowus'
  },
  {
    id: 'greenenergy',
    title: 'Green Energy',
    path: '/greenenergy',
    next: '/our-staff',
    prev: '/perfectcoffee'
  },
  {
    id: 'our-staff',
    title: 'Our Staff',
    path: '/our-staff',
    next: '/thefarm', // Cycle to first
    prev: '/greenenergy'
  }
];
