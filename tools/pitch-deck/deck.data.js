/* ============================================================
   THE STANDARD SUNLOGIC DECK
   Twelve sections, each one downloadable on its own. This file
   is the copy and the section order, and nothing else. How a
   slide looks is deck-render.js; how it is edited is
   deck-editor.js.

   THE COPY IS THE SITE'S OWN, LIFTED WORD FOR WORD from
   site-energy/index.html, energy.html, energy-management.html
   and contact.html. It is not a rewrite of them. A deck that
   says something the site does not say is a deck nobody has
   checked, and the site's wording has been through that.

   WHAT IS STILL BRACKETED IS STILL UNWRITTEN, and deliberately
   so. Those are the facts nobody has recorded anywhere in this
   repository: the figures, the prices, a client quotation, the
   insurance and callout terms, and how long each step takes.
   index.html already carries the same discipline in a comment
   next to the three installations: the numbers there are what
   was fitted, not what it saved, because the saving was never
   written down. Invent none of them. `Check` in the panel
   counts what is left.

   Company facts are the same object doc-builder uses, so a deck
   and a proposal cannot disagree about the VAT number.
   ============================================================ */
(function () {
  'use strict';

  var COMPANY = {
    name: 'Sunlogic SA',
    regName: 'Sunlogic SA (Pty) Ltd',
    reg: '2022/651654/07',
    vat: '[ VAT number ]',
    address: '9 Chesham Road, Claremont, 7708',
    email: 'sales@sunlogic.co.za',
    phone: '+27 (82) 655 5371',
    website: 'sunlogic.co.za',
    blurb: 'Solar and certified electrical contracting for homes and businesses in Cape Town.',
    contactName: 'Stephan Marais',
    contactRole: 'Technical &amp; commercial',
    contactEmail: 'stephan@sunlogic.co.za',
    contactPhone: '+27 (82) 655 5371'
  };

  window.SL_DECK_TEMPLATE = {
    v: 1,

    meta: {
      title:    'Sunlogic Energy',
      subtitle: '[ What this deck is for, in five words ]',
      ref:      '[ reference ]',
      date:     '[ date ]',
      client:   '[ Who it is for ]',
      footNote: 'Commercial in confidence.',
      pdfName:  'Sunlogic-Pitch'
    },

    company: COMPANY,

    sections: [

      /* ------------------------------------------------ 1. cover
         The site's hero, unchanged. The four facts are the only
         thing on this slide that changes per reader.           */
      { k: 'cover', n: 'Cover', d: 'Who it is for, what it is, and the four facts that frame it.',
        onePager: true,
        slides: [
          { type: 'cover',
            eyebrow: 'Sunlogic Energy',
            h: 'Every Unit You Make',
            em: 'Is One You Don&rsquo;t Buy',
            lead: 'Solar sized on twelve months of what you actually use, not on your roof area. '
                + 'Installed, certified, serviced and monitored by the same company.',
            kv: [
              { k: 'Prepared for', v: '[ client ]' },
              { k: 'Date',         v: '[ date ]' },
              { k: 'Reference',    v: '[ reference ]' },
              { k: 'Valid until',  v: '[ date ]' }
            ] }
        ] },

      /* ------------------------------------------------ 2. what we do */
      { k: 'what', n: 'What we do', d: 'The business in one slide. Read on its own, it still makes sense.',
        onePager: true,
        slides: [
          { type: 'cards', eyebrow: 'Who we work for',
            h: 'Three Kinds of Property,', em: 'Three Different Sums',
            lead: '',
            cols: 3,
            items: [
              { icon: 'home', title: 'Homes',
                body: 'A smaller, steadier bill, and a system built around your household '
                    + 'instead of pulled off a price list.' },
              { icon: 'bolt', title: 'Businesses',
                body: 'Shops, offices, workshops and guesthouses, where the daytime trading '
                    + 'hours are the ones solar covers best.' },
              { icon: 'calculator', title: 'Larger Sites',
                body: 'Factories, warehouses, farms and retail centres, sized on what the '
                    + 'site actually draws.' }
            ] }
        ] },

      /* ------------------------------------------------ 3. the problem
         The one dark band in the deck. Two of them and neither
         means anything.                                        */
      { k: 'problem', n: 'The problem', d: 'The cost of doing nothing. One statement, then the evidence.',
        slides: [
          { type: 'statement',
            eyebrow: 'Why now',
            text: 'Your Bill Can Rise in',
            em: 'a Month You Used Less',
            body: 'It isn&rsquo;t only the rate per unit. There&rsquo;s a fixed monthly charge you pay '
                + 'before you&rsquo;ve used anything at all, and it goes up too.' },
          { type: 'bullets', eyebrow: 'The long view',
            h: 'The Tariff Goes Up.', em: 'Your System Does Not.',
            lead: 'Electricity keeps getting more expensive and shows no sign of stopping. '
                + 'A system is the opposite kind of cost.',
            cols: 2,
            items: [
              'At home that shows up as a bill you can&rsquo;t plan around.',
              'In a business it shows up in the cost of everything you make or sell, month '
                + 'after month, whether trade was good or not.',
              'You buy it once, at today&rsquo;s price, and it goes on producing for years afterwards.',
              'The gap between those two lines is the whole point.'
            ] }
        ] },

      /* ------------------------------------------------ 4. the offer */
      { k: 'offer', n: 'The offer', d: 'What we are proposing, and what it includes.',
        onePager: true,
        slides: [
          { type: 'kv', eyebrow: 'Solar',
            h: 'Sized On What You Use,', em: 'Not What You Fear',
            lead: 'Two houses on the same street can need very different systems.',
            items: [
              { k: 'What we size it on',
                v: 'We work yours out from twelve months of your bills, then design, install '
                 + 'and certify it ourselves.' },
              { k: 'What you can check',
                v: 'Ask for the quote as a cost per unit, not only as a monthly saving. That is '
                 + 'the number you can hold against what you already pay, and it is the fastest '
                 + 'way to compare three proposals that have all been laid out differently.' },
              { k: 'How it can be paid for',
                v: 'Bank finance, solar-specific loans, rent-to-own arrangements and monthly '
                 + 'subscription options all exist in South Africa. They aren&rsquo;t all equal, and '
                 + 'the cancellation terms in particular are worth reading properly before you '
                 + 'sign anything.' },
              { k: 'What it does not include',
                v: '[ One paragraph. Say this here, not in the small print. ]' }
            ] }
        ] },

      /* ------------------------------------------------ 5. how it works
         The steps are the site's. How long each one takes is not
         written down anywhere, so it stays bracketed.          */
      { k: 'how', n: 'How it works', d: 'The sequence, from first call to sign-off.',
        slides: [
          { type: 'timeline', eyebrow: 'The whole job, not just the sale',
            h: 'Anyone Can Bolt', em: 'Panels to a Roof',
            lead: 'Five things have to happen for a system to still be earning in year five. '
                + 'Most companies sell you the first two.',
            items: [
              { when: '[ how long ]', title: 'Site Visit',
                body: 'Our calculator gives you a realistic range in a couple of minutes, and a '
                    + 'site visit turns that into an actual figure. We look at all of this on '
                    + 'site rather than off a satellite photo.' },
              { when: '[ how long ]', title: 'Design',
                body: 'Build for winter and you have an expensive system that&rsquo;s oversized for '
                    + 'most of the year. There&rsquo;s a real judgement call in there, and it&rsquo;s one '
                    + 'we&rsquo;d rather make with you than for you.' },
              { when: '[ how long ]', title: 'Install and Certify',
                body: 'Council registration, the Certificate of Compliance and the commissioning '
                    + 'record are ours to handle, not yours to chase.' },
              { when: '[ how long ]', title: 'Monitoring',
                body: 'The failures that cost you money are the quiet ones. The lights stay on, '
                    + 'the inverter hums, the app still shows power coming in, and you find out '
                    + 'on the bill six weeks later.' }
            ] }
        ] },

      /* ------------------------------------------------ 6. proof
         The three installations are the site's, and so is the
         rule next to them: what was fitted, not what it saved.
         No client has been quoted anywhere, so the quotation
         slide stays empty rather than being filled in for them. */
      { k: 'proof', n: 'Proof', d: 'Work already done, and someone who will say so.',
        slides: [
          { type: 'cards', eyebrow: 'Our work',
            h: 'Three Systems', em: 'We Installed',
            lead: 'A photograph and what was actually fitted, so you can judge the work rather '
                + 'than the claim.',
            cols: 3,
            items: [
              { icon: 'home', title: 'Stellenbosch',
                body: 'A new residential development for a private client. A 12kW system, '
                    + '18 panels and 15kWh of battery storage.' },
              { icon: 'bolt', title: 'Noordhoek',
                body: 'A private residence on three phase. One 8kW inverter and 10kWh of battery '
                    + 'on each phase, with 21 panels.' },
              { icon: 'scale', title: 'Rondebosch Prep',
                body: 'A school, sized for backup rather than for saving. Six 12kW inverters and '
                    + '250kWh of battery storage, no panels.' }
            ] },
          { type: 'quote',
            text: '[ What the client actually said. One sentence, their words, nothing tidied. ]',
            cite: '[ Name ]', role: '[ Role, company ]' }
        ] },

      /* ------------------------------------------------ 7. the numbers
         Nothing here is recorded anywhere. index.html says the
         same about its own three jobs: the saving was never
         written down, so it is flagged rather than invented.   */
      { k: 'numbers', n: 'The numbers', d: 'The four figures that carry the case.',
        onePager: true,
        slides: [
          { type: 'metrics', eyebrow: 'The numbers',
            h: 'What It Has', em: 'Actually Done',
            lead: '[ One sentence saying where these come from, so nobody has to ask. ]',
            items: [
              { v: '[ 00 ]', k: '[ What it measures ]', note: '[ Basis of the figure. ]' },
              { v: '[ 00 ]', k: '[ What it measures ]', note: '[ Basis of the figure. ]' },
              { v: '[ 00 ]', k: '[ What it measures ]', note: '[ Basis of the figure. ]' },
              { v: '[ 00 ]', k: '[ What it measures ]', note: '[ Basis of the figure. ]' }
            ] }
        ] },

      /* ------------------------------------------------ 8. what it costs
         The warning is the site's. The figures are per job and
         belong in a proposal, so they are left to be filled in. */
      { k: 'cost', n: 'What it costs', d: 'The price, and what sits outside it.',
        slides: [
          { type: 'table', eyebrow: 'What it costs',
            h: 'Three Things Move', em: 'the Price',
            lead: 'A large electricity bill has several different charges on it, and solar only '
                + 'reduces one of them. Some proposals quietly value every unit of solar at the '
                + 'most expensive rate on the account, which makes the payback look dramatically '
                + 'better than it really is.',
            head: ['Item', 'What it covers', 'Amount'],
            rows: [
              ['[ Item ]', '[ What it covers ]', '[ R 00 000 ]'],
              ['[ Item ]', '[ What it covers ]', '[ R 00 000 ]'],
              ['[ Item ]', '[ What it covers ]', '[ R 00 000 ]']
            ],
            note: 'A well-built commercial system is a genuinely good investment. It&rsquo;s just not '
                + 'an overnight one, and anyone telling you otherwise has done something to the '
                + 'arithmetic. We&rsquo;ll show you which rate we have applied and why.' }
        ] },

      /* ------------------------------------------------ 9. why us */
      { k: 'why', n: 'Why us', d: 'The reasons that are hard for anyone else to copy.',
        slides: [
          { type: 'bullets', eyebrow: 'Why Sunlogic',
            h: 'Straight Numbers, and', em: 'Someone to Call',
            lead: '',
            cols: 2,
            items: [
              '<strong>We size on what you use, not your roof.</strong> The saving comes off your '
                + 'last twelve months and we show you how we got there. The roof sets the ceiling. '
                + 'What you use sets the target.',
              '<strong>We are still here in year five.</strong> Servicing, cleaning and monitoring '
                + 'aren&rsquo;t an upsell we invented. They are how a system keeps earning.',
              '<strong>We will take on a system we did not install.</strong> Plenty of people are '
                + 'holding one whose installer has gone quiet. That&rsquo;s a good part of what we do.',
              '<strong>VoltIQ is ours.</strong> We built it, we run it, and it reads your inverter '
                + 'manufacturer&rsquo;s own cloud data every morning to tell us what changed.'
            ] }
        ] },

      /* ---------------------------------------------- 10. risk
         Certification is recorded. Insurance and what happens on
         a callout are not, anywhere, so they are left open.    */
      { k: 'risk', n: 'Risk and compliance', d: 'Certification, insurance, and what happens when something goes wrong.',
        slides: [
          { type: 'kv', eyebrow: 'Compliance',
            h: 'Paperwork Is Part of', em: 'the Job',
            lead: 'Solar is electrical work, and ours is inspected, tested and certified properly.',
            items: [
              { k: 'Certification',
                v: 'SSEG application submitted on your behalf. Certificate of Compliance issued '
                 + 'on every installation. Commissioning record handed over with the system.' },
              { k: 'The battery guarantee',
                v: 'One question worth asking any installer, including us: what does the battery '
                 + 'guarantee actually promise? Some are satisfied if the battery still holds a '
                 + 'good deal less than it started with, which sounds like a technicality until '
                 + 'the day you need it.' },
              { k: 'Insurance',
                v: '[ One paragraph. What is covered while work is on site. ]' },
              { k: 'If it goes wrong',
                v: '[ One paragraph. Who the reader calls, and what happens next. ]' }
            ] }
        ] },

      /* ---------------------------------------------- 11. next steps
         One closing call to action in the deck. Only one. Both
         labels are the site's own buttons.                     */
      { k: 'next', n: 'Next steps', d: 'The one thing the reader has to do next.',
        slides: [
          { type: 'cta', eyebrow: 'Next steps',
            h: 'Book Your Free', em: 'Site Visit',
            lead: 'If solar isn&rsquo;t worth it for your property yet, we&rsquo;ll tell you that instead. '
                + 'We&rsquo;ll be in touch within 24 hours.',
            actions: [
              { label: 'Book Your Free Site Visit', sub: 'sales@sunlogic.co.za' },
              { label: 'Run the Sums Yourself', sub: 'sunlogic.co.za' }
            ] }
        ] },

      /* ---------------------------------------------- 12. contact */
      { k: 'contact', n: 'Contact', d: 'Who to call, and the registered details.',
        onePager: true,
        slides: [
          { type: 'contact', eyebrow: 'Contact',
            h: 'Talk to', em: 'Us',
            lead: '' }
        ] }
    ]
  };
}());
