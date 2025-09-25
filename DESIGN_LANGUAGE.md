# PetID System - Design Language & Style Guidelines

## Overview
This document outlines the current design language and visual style guidelines for the PetID System, specifically focusing on the Pet Display Page. These guidelines ensure consistency across the application and provide reference for future development.

## Core Design Principles

### 1. **Minimalist & Clean**
- Clean layouts with proper white space
- Subtle visual elements that don't compete for attention
- Focus on content readability and user experience

### 2. **Responsive & Mobile-First**
- Optimized for mobile viewing (max-width: 420px default)
- Adaptive layouts that scale appropriately
- Touch-friendly interaction elements

### 3. **Accessibility & Readability**
- High contrast text (gray-900 to gray-700 dark:white to gray-200)
- Proper font sizing and line heights
- Dark mode support throughout

## Color Palette

### Light Mode
- **Primary Background**: `bg-white`
- **Secondary Background**: `bg-gray-50/50` to `bg-gray-100/50`
- **Text Primary**: `text-gray-900` to `text-gray-700`
- **Text Secondary**: `text-gray-600` to `text-gray-400`
- **Borders**: `border-gray-200/50` to `border-gray-200/60`
- **Dividers**: `bg-gray-100`

### Dark Mode
- **Primary Background**: `dark:bg-gray-900` to `dark:bg-gray-800`
- **Secondary Background**: `dark:bg-gray-700/30` to `dark:bg-gray-800/90`
- **Text Primary**: `dark:text-white` to `dark:text-gray-200`
- **Text Secondary**: `dark:text-gray-400` to `dark:text-gray-500`
- **Borders**: `dark:border-gray-700/50` to `dark:border-gray-600/50`
- **Dividers**: `dark:bg-gray-700/50`

### Accent Colors
- **Primary**: Indigo gradient (`from-indigo-500 to-purple-500`)
- **Interactive**: `text-indigo-600 dark:text-indigo-400`
- **Hover States**: `hover:bg-indigo-50 dark:hover:bg-indigo-900/20`

## Typography

### Font Hierarchy
- **Pet Name**: `text-[1.75rem] font-bold` with gradient background
- **Breed Info**: `text-base font-medium`
- **Description**: `text-base leading-relaxed`
- **Button Labels**: `text-sm font-semibold`
- **Helper Text**: `text-xs`

### Text Alignment
- **Consistent Left Alignment**: All text elements within the same container share identical left margins
- **Container Padding**: `p-6` (24px) for main content areas
- **Vertical Spacing**: `my-5` (20px) for section separators

## Layout Structure

### Container System
```
Layout Component (max-w-[420px])
├── Header (optional)
├── Main Content
│   ├── Pet Details Container (p-6, gradient background)
│   │   ├── Pet Header (flex, justify-between)
│   │   ├── Divider (my-5, subtle line)
│   │   └── Description (direct child, perfect alignment)
│   ├── Gallery Section
│   └── Action Buttons Grid
└── Footer (optional)
```

### Spacing Guidelines
- **Section Margins**: `mt-6` (24px) between major sections
- **Element Spacing**: `mb-2` to `mb-4` for related elements
- **Divider Spacing**: `my-5` (20px) above and below
- **Button Grid**: `gap-4` (16px) between action buttons

## Visual Elements

### Gradients
- **Text Gradients**: `bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent`
- **Background Gradients**: `bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80`
- **Button Gradients**: `bg-gradient-to-r from-[color1] to-[color2]`

### Borders & Shadows
- **Subtle Borders**: `border border-gray-200/50 dark:border-gray-700/50`
- **Rounded Corners**: `rounded-2xl` for containers, `rounded-xl` for smaller elements
- **Hover Shadows**: `hover:shadow-lg` with color-matched shadow variants

### Interactive States
- **Hover Scale**: `hover:scale-[1.03]` for buttons
- **Transition**: `transition-all duration-300` for smooth animations
- **Button States**: Color shifts and shadow changes on hover

## Component Patterns

### Dividers
```css
/* Subtle divider line */
.divider {
  height: 1px; /* h-px */
  margin: 20px 0; /* my-5 */
  background: gray-100 (light) / gray-700/50 (dark);
}
```

### Action Buttons
- **Grid Layout**: `grid-cols-3` for consistent distribution
- **Height**: `h-[120px]` for adequate touch targets
- **Padding**: `p-3` internal spacing
- **Icon Container**: `p-3` with gradient backgrounds
- **Hover Effects**: Scale, shadow, and color transitions

### Gallery Controls
- **Auto-hide**: Mouse enter/leave based visibility
- **Positioning**: Fixed positioning with backdrop blur
- **Icons**: Lucide React icons with consistent sizing
- **Backgrounds**: Semi-transparent with blur effects

## Technical Implementation

### CSS Framework
- **Tailwind CSS**: Primary styling framework
- **Custom Properties**: CSS variables for theme consistency
- **Responsive Design**: Breakpoint-based adaptations

### State Management
- **Theme**: Zustand-based theme store
- **UI States**: Local component state for interactions
- **Animations**: CSS transitions with JavaScript triggers

### File Structure
- **Components**: Modular React components
- **Layout**: Consistent wrapper components
- **Hooks**: Custom hooks for theme and state management

## Content Guidelines

### Text Content
- **Concise**: Clear, brief descriptions
- **Consistent**: Uniform tone and terminology
- **Accessible**: Simple language, proper contrast

### Visual Hierarchy
1. Pet name (largest, gradient)
2. Breed and age info (medium, secondary color)
3. Description (body text, standard size)
4. Action labels (small, bold)

## Future Considerations

### Scalability
- **Component Library**: Extract reusable components
- **Design Tokens**: Centralize design decisions
- **Accessibility**: WCAG compliance improvements

### Performance
- **Lazy Loading**: Image optimization
- **Bundle Size**: Component tree shaking
- **Animations**: Hardware acceleration

---

*Last Updated: 2025-01-25*
*Version: 1.0*

This design language serves as the foundation for maintaining visual consistency and user experience quality throughout the PetID System.