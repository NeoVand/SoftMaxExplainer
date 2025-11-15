# SoftMaxExplainer

An interactive, educational visualization of the softmax function with temperature control. Explore how the softmax function transforms input data into probability distributions, and learn about its deep connections to statistical mechanics, information theory, and machine learning.

## Features

- 🎨 **Interactive Visualizations**: Real-time bar charts and distribution histograms
- 🌡️ **Temperature Control**: Adjust the temperature parameter (0.1 to 5.0) to see its effect on distributions
- 📊 **Dynamic Data**: Generate random data and control the number of data points (2-100)
- 🔄 **Sorting**: View data in sorted order to better understand the transformation
- 🌓 **Dark Mode**: Beautiful theme switching with full support for light and dark modes
- 📚 **Educational Content**: Comprehensive explanations with historical context and mathematical derivations
- 📐 **Beautiful LaTeX**: Professional equation rendering using KaTeX

## Technologies

- **SvelteKit** - Modern web framework
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type-safe code
- **KaTeX** - Mathematical equation rendering

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Setup:

1. Push your code to the `main` branch
2. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
3. The workflow will automatically build and deploy on every push to `main`

### Manual Deployment:

You can also trigger deployment manually from the Actions tab.

The site will be available at: `https://[username].github.io/SoftMaxExplainer/`

## Project Structure

```
src/
├── lib/
│   ├── components/      # Reusable components
│   │   ├── BarChart.svelte
│   │   ├── Histogram.svelte
│   │   ├── InfoModal.svelte
│   │   ├── LatexEquation.svelte
│   │   └── ThemeToggle.svelte
│   ├── stores/          # State management
│   │   └── theme.svelte.ts
│   └── utils/           # Utility functions
│       └── softmax.ts
└── routes/
    ├── +layout.svelte
    ├── +layout.ts
    └── +page.svelte
```

## Educational Content

The app includes comprehensive explanations of:

- The softmax function and its mathematical properties
- Historical origins (Boltzmann, Shannon, Jaynes)
- Derivation from maximum entropy principle
- Temperature parameter and its physical meaning
- Real-world applications in ML/AI
- Modern alternatives and research directions

## Author

Developed by **Neo Mohsenvand** for educational purposes.

## License

This project is open source and available for educational use.
