// Source order is display order. Add future projects at the top; sequence numbers are derived below.
const projectSource = [
  {
    slug: "ace",
    title: "ACE",
    description: "Brand Identity",
    projectType: "Personal Brand Identity",
    image: "assets/works/ace.png",
    imageAlt: "ACE project preview",
    href: "ace/",
    nodeId: "288:458",
  },
  {
    slug: "brand-new-day",
    title: "Brand New Day",
    description: "UX/UI",
    projectType: "Promotional Web",
    image: "assets/works/brand-new-day.jpg",
    imageAlt: "Brand New Day project preview",
    href: "brand-new-day/",
    nodeId: "288:459",
  },
  {
    slug: "calmato",
    title: "Calmato",
    description: "UX/UI",
    projectType: "Responsive Web UX/UI Design",
    image: "assets/works/calmato.png",
    imageAlt: "Calmato project preview",
    href: "calmato/",
    nodeId: "288:460",
  },
  {
    slug: "calmato-youtube",
    title: "Calmato",
    description: "Youtube",
    projectType: "YouTube",
    image: "assets/works/youtube-calmato.png",
    imageAlt: "Youtube Calmato project preview",
    href: "https://youtube.com/channel/UCyv16-9W5sOhQr-svxCJ1qQ?si=epe7wnfn21DEp5SN",
    external: true,
    sequence: false,
    nodeId: "288:461",
  },
  {
    slug: "beerby",
    title: "Beerby",
    description: "UX/UI",
    projectType: "Mobile App UX/UI Design",
    image: "assets/works/beerby.jpg",
    imageAlt: "Beerby project preview",
    href: "beerby/",
    nodeId: "288:462",
  },
  {
    slug: "onthetrip",
    title: "On The Trip",
    description: "UX/UI",
    projectType: "Mobile App UX/UI Design",
    image: "assets/works/on-the-trip.png",
    imageAlt: "On The Trip project preview",
    href: "onthetrip/",
    nodeId: "288:463",
  },
  {
    slug: "zippo",
    title: "Zippo X Old School",
    description: "Package",
    projectType: "Package · Graphic Design",
    image: "assets/works/zippo.jpg",
    imageAlt: "Zippo project preview",
    href: "zippo/",
    nodeId: "288:464",
  },
  {
    slug: "철거병단",
    title: "철거병단",
    description: "Brand Identity",
    projectType: "Brand Identity · Graphic Design",
    image: "assets/works/demolition-corps.png",
    imageAlt: "철거병단 project preview",
    href: "철거병단",
    nodeId: "288:465",
  },
];

let projectOrder = 0;

window.PORTFOLIO_PROJECTS = projectSource.map((project) => {
  if (project.sequence === false) {
    return { ...project, order: null, number: null };
  }

  projectOrder += 1;
  return {
    ...project,
    order: projectOrder,
    number: String(projectOrder).padStart(2, "0"),
  };
});

window.PORTFOLIO_PROJECT_SEQUENCE = window.PORTFOLIO_PROJECTS.filter(
  (project) => project.order !== null,
);
