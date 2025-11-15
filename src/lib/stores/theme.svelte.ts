import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

class ThemeStore {
	current = $state<Theme>('light');

	constructor() {
		if (browser) {
			// Initialize from localStorage or system preference
			const stored = localStorage.getItem('theme') as Theme | null;
			if (stored) {
				this.current = stored;
			} else {
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				this.current = prefersDark ? 'dark' : 'light';
			}
			
			// Apply initial theme immediately
			this.applyTheme();
		}
	}

	toggle() {
		this.current = this.current === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('theme', this.current);
			this.applyTheme();
		}
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
