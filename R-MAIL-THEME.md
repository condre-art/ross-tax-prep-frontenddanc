# R-MAIL Formal Brown Theme

## Overview
The R-MAIL interface now uses a professional "Formal Brown" theme designed for compliance-first applications. This theme embodies **trust, restraint, and regulator comfort** - providing quiet authority perfect for enterprise SaaS applications.

## Design Philosophy
> "Compliance-first. Executive calm. Built to last."

This color scheme creates an authoritative, professional atmosphere suitable for financial, legal, and regulatory environments where trust and stability are paramount.

## Color Palette

### Core Neutrals

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| Espresso Brown | `#1B1A17` | `rmail-espresso` | Primary Background |
| Dark Mocha | `#23201B` | `rmail-mocha` | Surface / Panels |
| Warm Slate | `#2A2621` | `rmail-slate` | Secondary Surface |
| Ash Brown | `#3A342C` | `rmail-ash` | Borders / Dividers |

### Typography Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| Warm Off-White | `#D6D3CD` | `rmail-offwhite` | Primary Text |
| Taupe Gray | `#AFA99F` | `rmail-taupe` | Secondary Text |
| Muted Sand | `#8E8579` | `rmail-sand` | Disabled / Meta Text |

### Functional Accents

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| Steel Blue | `#4FC1FF` | `rmail-steel` | Primary Actions |
| Muted Azure | `#3794FF` | `rmail-azure` | Links / Focus States |

## Usage Guidelines

### Backgrounds
- **Main App Background**: Use `bg-rmail-espresso` for the overall application background
- **Panels/Cards**: Use `bg-rmail-mocha` for content containers
- **Interactive Elements**: Use `bg-rmail-slate` for buttons, inputs, and hover states
- **Borders**: Use `border-rmail-ash` for all borders and dividers

### Text Hierarchy
- **Headings**: Use `text-rmail-offwhite` for all headings (h1, h2, h3)
- **Body Text**: Use `text-rmail-taupe` for secondary and descriptive text
- **Meta Information**: Use `text-rmail-sand` for timestamps, labels, and disabled text

### Interactive Elements
- **Primary Buttons**: 
  - Base: `bg-rmail-steel text-rmail-espresso`
  - Hover: `hover:bg-rmail-azure`
  - Always include `transition` for smooth state changes

- **Links**: 
  - Base: `text-rmail-azure`
  - Hover: `hover:text-rmail-steel`

- **Form Inputs**:
  - Background: `bg-rmail-slate`
  - Text: `text-rmail-offwhite`
  - Border: `border-rmail-ash`
  - Focus: `focus:ring-rmail-steel focus:border-rmail-steel`
  - Placeholder: `placeholder-rmail-sand`

### Status Colors

For status indicators and alerts, use muted versions with transparency:

- **Success**: `bg-green-900/20 border-green-500 text-green-300`
- **Error**: `bg-red-900/20 border-red-500 text-red-300`
- **Warning**: `bg-yellow-900/20 border-yellow-500 text-yellow-300`
- **Info**: `bg-blue-900/20 border-blue-500 text-blue-300`

## Implementation

The theme is configured in `tailwind.config.ts` under the `rmail` color namespace:

```typescript
colors: {
  rmail: {
    'espresso': '#1B1A17',
    'mocha': '#23201B',
    'slate': '#2A2621',
    'ash': '#3A342C',
    'offwhite': '#D6D3CD',
    'taupe': '#AFA99F',
    'sand': '#8E8579',
    'steel': '#4FC1FF',
    'azure': '#3794FF',
  },
}
```

## Applied To

The formal brown theme has been applied to all R-MAIL components:

- ✅ Main layout and navigation
- ✅ Dashboard/home page
- ✅ Authentication pages (login/register)
- ✅ Email compose interface
- ✅ Inbox and email management
- ✅ Admin dashboard
- ✅ User management interface
- ✅ Domain management interface
- ✅ Audit logs viewer

## Best Practices

1. **Contrast**: Always ensure sufficient contrast between text and background colors
2. **Consistency**: Use the defined color palette exclusively - avoid introducing new colors
3. **Shadows**: Pair `bg-rmail-mocha` containers with `shadow-lg` and `border border-rmail-ash` for depth
4. **Transitions**: Add `transition` classes to all interactive elements for smooth state changes
5. **Accessibility**: Test with screen readers and ensure WCAG AA compliance minimum

## When to Use This Theme

This theme is ideal for:
- Financial services applications
- Legal and compliance platforms
- Enterprise SaaS products
- Regulatory technology (RegTech)
- Professional services portals
- Government and institutional systems

The formal brown palette projects stability, trustworthiness, and professional authority - essential qualities for applications in regulated industries.
