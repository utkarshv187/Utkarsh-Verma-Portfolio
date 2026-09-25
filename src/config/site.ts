// Single source of truth for the deployed origin.
// Change SITE_URL here to switch domains — meta/OG/canonical/sitemap all read from it.
export const SITE_URL = 'https://uxuiuv.vercel.app';

// All external links, captured from the live site (see AUDIT.md §7).
// One résumé link used site-wide (header Résumé button, all breakpoints), opened in a new tab.
export const LINKS = {
  resume: 'https://drive.google.com/file/d/1EvrImXsOyJRC91z4bxUpK2U5gzaE_x-I/view?usp=sharing',
  whatsapp:
    'https://api.whatsapp.com/send/?phone=918869808079&text=Hi+Utkarsh%2C+I+visited+your+portfolio+and+would+like+to+discuss+an+opportunity.&type=phone_number&app_absent=0',
  email: 'mailto:utkarshv187@gmail.com',
  linkedin: 'https://www.linkedin.com/in/uxuiuv/',
  projectAuctionPLP: 'https://auction-plp-redesign-by-uv.vercel.app/',
  projectGamification: 'https://gamification-by-uv.vercel.app/',
  projectDesignSystem:
    'https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7/Spinny-Design-System---Styles---Components?node-id=2-4101',
  framer: 'https://www.framer.com/',
} as const;

// Standard attrs for external links (authorized: add rel where the original left it empty).
export const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' } as const;
