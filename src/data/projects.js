export const projects = [
  {
    id: 'thefarm',
    title: 'La finca',
    path: '/thefarm',
    next: '/ourprocess',
    prev: '/our-staff' // Cycle back to last
  },
  {
    id: 'ourprocess',
    title: 'Nuestro proceso',
    path: '/ourprocess',
    next: '/gettoknowus',
    prev: '/thefarm'
  },
  {
    id: 'gettoknowus',
    title: 'Conócenos',
    path: '/gettoknowus',
    next: '/perfectcoffee',
    prev: '/ourprocess'
  },
  {
    id: 'perfectcoffee',
    title: 'Café perfecto',
    path: '/perfectcoffee',
    next: '/greenenergy',
    prev: '/gettoknowus'
  },
  {
    id: 'greenenergy',
    title: 'Energía verde',
    path: '/greenenergy',
    next: '/our-staff',
    prev: '/perfectcoffee'
  },
  {
    id: 'our-staff',
    title: 'Nuestro equipo',
    path: '/our-staff',
    next: '/thefarm', // Cycle to first
    prev: '/greenenergy'
  }
];
