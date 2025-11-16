import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

class ThemeStore {
	current = $state<Theme>('dark');

	constructor() {
		if (browser) {
			// Initialize from localStorage or default to dark
			const stored = localStorage.getItem('theme') as Theme | null;
			if (stored) {
				this.current = stored;
			} else {
				this.current = 'dark'; // Default to dark mode
			}
			
			// Apply initial theme
			this.applyTheme();
		}
	}

	toggle() {
		this.current = this.current === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('theme', this.current);
		}
		this.applyTheme();
	}

	private applyTheme() {
		if (!browser) return;
		
		const html = document.documentElement;
		
		if (this.current === 'dark') {
			html.classList.add('dark');
		} else {
			html.classList.remove('dark');
		}
		
		console.log('Theme applied:', this.current, 'Dark class present:', html.classList.contains('dark'));
	}
}

export const theme = new ThemeStore();
