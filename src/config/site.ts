export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Talleres Municipales",
  description: "Sistema de gestión de talleres deportivos municipales.",
  navItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Talleres",
      href: "/talleres",
    },
    {
      label: "Alumnos",
      href: "/alumnos",
    },
    {
      label: "Profesores",
      href: "/profesores",
    },
    {
      label: "Horarios",
      href: "/horarios",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Talleres",
      href: "/talleres",
    },
    {
      label: "Alumnos",
      href: "/alumnos",
    },
    {
      label: "Profesores",
      href: "/profesores",
    },
    {
      label: "Horarios",
      href: "/horarios",
    },
    {
      label: "Cerrar Sesión",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/naxoku",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
