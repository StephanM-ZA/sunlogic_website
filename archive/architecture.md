# Sunlogic SA Website Architecture & Sitemap

## Executive Summary

This document outlines the complete website architecture for Sunlogic SA, designed to enhance user engagement, improve lead generation, and establish competitive positioning in the Western Cape solar and electrical market.

---

## 1. Site Map

```
sunlogic.co.za/
│
├── Home (/)
│
├── Services (/services/)
│   ├── Residential Solar (/services/residential-solar/)
│   ├── Commercial Solar (/services/commercial-solar/)
│   ├── Electrical Contracting (/services/electrical-contracting/)
│   └── Solar Maintenance (/services/solar-maintenance/)
│
├── Projects (/projects/)
│   ├── Residential Projects (/projects/residential/)
│   ├── Commercial Projects (/projects/commercial/)
│   └── [Individual Project Pages] (/projects/[project-slug]/)
│
├── Resources (/resources/)
│   ├── Blog (/blog/)
│   │   └── [Blog Posts] (/blog/[post-slug]/)
│   ├── Solar Calculator (/resources/solar-calculator/)
│   ├── FAQs (/resources/faqs/)
│   └── Downloadable Guides (/resources/guides/)
│
├── About Us (/about/)
│   ├── Our Story (/about/our-story/)
│   ├── Our Team (/about/team/)
│   └── Certifications (/about/certifications/)
│
├── Contact (/contact/)
│
├── Get a Quote (/get-a-quote/)
│
└── Legal Pages
    ├── Privacy Policy (/privacy-policy/)
    └── Terms & Conditions (/terms-conditions/)
```

---

## 2. Page Architecture & Templates

### 2.1 Homepage

**Purpose:** Convert visitors into leads, establish credibility, guide users to relevant content

**WordPress Template:** Front Page Template (Custom)

**Sections (Top to Bottom):**

1. **Hero Section**
   - Background: High-quality image/video of solar installation
   - H1: "Leaders in Solar and Electrical"
   - Subheading: Value proposition (e.g., "Powering Western Cape Homes & Businesses Since [Year]")
   - Primary CTA: "Get Your Free Solar Assessment"
   - Secondary CTA: "View Our Projects"
   - Trust badges (certifications inline)

2. **Services Overview**
   - 4-column grid layout
   - Icon + Title + Brief description + "Learn More" link
   - Services: Residential Solar, Commercial Solar, Electrical, Maintenance

3. **Why Choose Sunlogic**
   - 3-4 key differentiators with icons
   - Examples: Years Experience, Projects Completed, Warranty Coverage, Certified Technicians

4. **Featured Projects Slider**
   - 3-4 project cards with images
   - Project type, location, system size
   - Link to full portfolio

5. **Social Proof Section**
   - Customer testimonials carousel
   - Google Reviews integration (star rating + review count)
   - Commercial client logos (if applicable)

6. **Lead Magnet Section**
   - Background with solar theme
   - Offer: "Download Our Free Guide: The Western Cape Homeowner's Guide to Solar"
   - Email capture form

7. **Blog Preview**
   - 3 latest blog posts
   - Title, excerpt, featured image
   - "Read More" and "View All Posts" links

8. **Final CTA Section**
   - "Ready to Go Solar?"
   - Contact form or "Get a Quote" button
   - Phone number prominently displayed

---

### 2.2 Service Pages Template

**Purpose:** Educate visitors, build trust, convert to leads

**WordPress Template:** Service Single Template (Custom)

**Sections:**

1. **Hero Banner**
   - Service-specific image
   - H1: Service name
   - Brief intro paragraph
   - CTA: "Get a Free Quote"

2. **Service Overview**
   - Detailed description (300-500 words)
   - Benefits list (bulleted)
   - 2-column layout with image

3. **Our Process**
   - Step-by-step process (numbered timeline)
   - 4-6 steps typical
   - Icons for each step

4. **Products & Technology**
   - Brands we use (logos)
   - Product highlights
   - Technical specifications (collapsible)

5. **Related Projects Gallery**
   - 4-6 project thumbnails
   - Filterable by project type
   - Link to full portfolio

6. **FAQs Accordion**
   - 5-8 service-specific FAQs
   - Schema markup for SEO

7. **Testimonials**
   - 2-3 service-specific testimonials
   - Customer name, location, project type

8. **CTA Section**
   - "Ready for [Service Name]?"
   - Quote request form (inline)

---

### 2.3 Projects/Portfolio Page

**Purpose:** Showcase expertise, build confidence

**WordPress Template:** Portfolio Archive Template

**Features:**

1. **Filter Bar**
   - Filter by: Residential/Commercial/Electrical
   - Filter by: System size, Location

2. **Project Grid**
   - Masonry or uniform grid
   - Hover effect with project details
   - Quick view option

3. **Individual Project Page Template**
   - Hero image gallery (slider)
   - Project details sidebar:
     - Location
     - System size
     - Installation date
     - Products used
   - Project description
   - Before/After (if applicable)
   - Client testimonial
   - Related projects

---

### 2.4 Blog Architecture

**Purpose:** SEO, thought leadership, lead nurturing

**WordPress Template:** Blog Archive + Single Post

**Categories:**
- Solar Energy Basics
- Residential Solar
- Commercial Solar
- Electrical Safety & Compliance
- Industry News
- Case Studies
- Tips & Guides

**Single Post Template:**
1. Featured image
2. Title, date, category, reading time
3. Content area
4. Author bio
5. Related posts
6. CTA sidebar (sticky):
   - "Get a Quote" button
   - Lead magnet download
7. Social share buttons
8. Comment section (optional)

---

### 2.5 About Us Section

**Purpose:** Build trust, humanize the brand

**Pages:**

1. **Our Story**
   - Company history timeline
   - Mission & values
   - Why we do what we do

2. **Our Team**
   - Team grid with photos
   - Name, role, brief bio
   - Certifications per team member

3. **Certifications**
   - Full list of accreditations
   - Certification logos
   - What each means for the customer

---

### 2.6 Contact Page

**Purpose:** Convert, provide access

**Elements:**
1. Contact form (Name, Email, Phone, Service Interest, Message)
2. Direct contact info (Phone, Email, Address)
3. Business hours
4. Google Maps embed
5. Social media links

---

### 2.7 Get a Quote Page (Lead Capture)

**Purpose:** Primary conversion point

**Form Fields:**
- Name*
- Email*
- Phone*
- Service Type (dropdown)
- Property Type (Residential/Commercial)
- Estimated monthly electricity bill (range)
- Preferred contact method
- Additional notes (textarea)

**Additional Elements:**
- "What happens next" process explanation
- Response time commitment
- Phone number for immediate contact
- Privacy assurance

---

## 3. WordPress Implementation

### 3.1 Recommended Theme Approach

**Option A: Page Builder Theme**
- Theme: Astra Pro or GeneratePress Premium
- Builder: Elementor Pro or Beaver Builder
- Benefits: Flexible, maintainable, good performance

**Option B: Purpose-Built Theme**
- Theme: Flavor theme (solar-specific) or Industrial theme
- Customizer-based
- Benefits: Faster setup, solar-specific features

### 3.2 Essential Plugins

| Category | Plugin | Purpose |
|----------|--------|---------|
| SEO | Yoast SEO or RankMath | On-page optimization |
| Forms | WPForms or Gravity Forms | Lead capture |
| Performance | WP Rocket | Speed optimization |
| Security | Wordfence | Security hardening |
| Backup | UpdraftPlus | Automated backups |
| Analytics | MonsterInsights | GA4 integration |
| Schema | Schema Pro | Rich snippets |
| Reviews | WP Business Reviews | Google Reviews display |
| Gallery | Envira Gallery | Project portfolios |
| Calculator | Cost Calculator Builder | Solar savings calculator |

### 3.3 Custom Post Types

1. **Projects** (CPT)
   - Taxonomies: Project Type, Location, System Size
   - Custom fields: Technical specs, client name, testimonial

2. **Testimonials** (CPT)
   - Fields: Client name, location, service type, rating, quote

3. **Team Members** (CPT)
   - Fields: Name, role, bio, certifications, photo

---

## 4. Lead Generation Elements

### 4.1 Lead Magnets

1. **Free Solar Assessment**
   - Primary offer throughout site
   - Detailed form on dedicated landing page

2. **Downloadable Guides**
   - "Homeowner's Guide to Solar Energy in WC"
   - "Business Owner's Guide to Commercial Solar"
   - "Understanding Electrical Compliance (COCs)"
   - Gate behind email capture

3. **Solar Savings Calculator**
   - Interactive tool
   - Email results option
   - Lead capture at end

### 4.2 CTA Placement Strategy

| Location | CTA Type | Priority |
|----------|----------|----------|
| Header (sticky) | "Get a Quote" button | High |
| Hero sections | Primary action button | High |
| Service pages | Inline form | High |
| Blog sidebar | Lead magnet | Medium |
| Footer | Contact info + button | Medium |
| Exit intent popup | Special offer | Medium |
| Floating button (mobile) | Phone/WhatsApp | High |

### 4.3 Forms Strategy

- **Short forms** (3-4 fields): Initial contact, newsletter
- **Medium forms** (5-7 fields): Quote requests
- **Long forms** (8+ fields): Detailed assessments
- Multi-step forms for better completion rates

---

## 5. Navigation Structure

### 5.1 Primary Navigation

```
[Logo]  Home | Services ▼ | Projects | Resources ▼ | About ▼ | Contact | [Get a Quote]

Services Dropdown:
- Residential Solar
- Commercial Solar
- Electrical Contracting
- Solar Maintenance

Resources Dropdown:
- Blog
- Solar Calculator
- FAQs
- Guides & Downloads

About Dropdown:
- Our Story
- Our Team
- Certifications
```

### 5.2 Footer Navigation

**Column 1: Services**
- All service links

**Column 2: Company**
- About Us
- Projects
- Blog
- Contact

**Column 3: Resources**
- FAQs
- Solar Calculator
- Downloadable Guides
- Privacy Policy

**Column 4: Contact**
- Phone
- Email
- Address
- Social icons
- Business hours

---

## 6. Mobile Considerations

1. **Mobile-first design** approach
2. **Sticky header** with hamburger menu
3. **Click-to-call** buttons prominent
4. **WhatsApp integration** for quick contact
5. **Simplified forms** on mobile
6. **Touch-friendly** gallery and sliders
7. **Fast loading** (target < 3 seconds)

---

## 7. SEO Architecture

### 7.1 URL Structure
- Clean, keyword-rich URLs
- Logical hierarchy
- No dates in blog URLs

### 7.2 Target Keywords by Page

| Page | Primary Keywords |
|------|-----------------|
| Home | solar installers western cape, sunlogic |
| Residential Solar | residential solar installation cape town |
| Commercial Solar | commercial solar panels western cape |
| Electrical | electrical contractor cape town |
| Blog | [various long-tail keywords] |

### 7.3 Internal Linking Strategy
- Service pages link to related projects
- Blog posts link to relevant services
- Projects link back to services
- Breadcrumbs on all pages

---

## 8. Conversion Tracking

### 8.1 Goals to Track
1. Quote form submissions
2. Phone clicks
3. Email clicks
4. Guide downloads
5. Calculator completions
6. Contact form submissions

### 8.2 Implementation
- Google Analytics 4 events
- Google Tag Manager
- Facebook Pixel (if running ads)
- Form submission tracking
- Heatmaps (Hotjar/Microsoft Clarity)

---

## 9. Content Priority Matrix

### Phase 1 (Launch)
- Homepage
- All service pages
- Contact page
- Get a Quote page
- About (main page)
- 5-10 projects

### Phase 2 (Month 1-2)
- Team page
- Certifications page
- FAQs
- 5 initial blog posts
- Additional projects

### Phase 3 (Ongoing)
- Weekly blog posts
- Monthly project additions
- Downloadable guides
- Solar calculator
- Testimonial collection

---

## 10. Technical Requirements

1. **Hosting:** Managed WordPress hosting (e.g., WP Engine, Cloudways)
2. **SSL:** HTTPS required
3. **CDN:** CloudFlare or similar
4. **Caching:** Page and browser caching
5. **Image optimization:** WebP format, lazy loading
6. **Database optimization:** Regular cleanup
7. **PHP version:** 8.0+
8. **Backup:** Daily automated backups
9. **Uptime monitoring:** 99.9% target

---

## Summary

This architecture provides Sunlogic SA with a modern, conversion-focused website structure that:

- Guides visitors through a clear journey from awareness to conversion
- Establishes authority through content and social proof
- Captures leads at multiple touchpoints
- Supports SEO growth strategy
- Differentiates from competitors through user experience
- Scales with business growth

The WordPress implementation allows for easy content management while maintaining professional design and performance standards.
