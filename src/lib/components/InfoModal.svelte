<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();
	let showAbout = $state(false);
	let equationsRendered = $state(false);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (showAbout) {
				showAbout = false;
			} else {
				onclose();
			}
		}
	}

	// Render LaTeX equations when modal opens
	$effect(() => {
		if (open && !equationsRendered) {
			renderEquations();
		}
	});

	async function renderEquations() {
		const katex = await import('katex');
		
		const equations = [
			{ id: 'eq-main', tex: String.raw`\text{softmax}(x_i) = \frac{e^{x_i/\tau}}{\sum_{j=1}^{n} e^{x_j/\tau}}` },
			{ id: 'eq-boltzmann', tex: String.raw`P(i) = \frac{e^{-E_i / kT}}{Z}` },
			{ id: 'eq-temp', tex: String.raw`\sigma(z)_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}` },
			{ id: 'eq-entropy', tex: String.raw`H(p) = -\sum_i p_i \log p_i` },
			{ id: 'eq-crossentropy', tex: String.raw`H(p, q) = -\sum_i p_i \log q_i` },
			{ id: 'eq-derivative', tex: String.raw`\frac{\partial \sigma(z)_i}{\partial z_j} = \sigma(z)_i (\delta_{ij} - \sigma(z)_j)` },
			{ id: 'eq-maxentropy', tex: String.raw`\max_p \; H(p) = -\sum_i p_i \log p_i` },
			{ id: 'eq-constraint', tex: String.raw`\sum_i p_i E_i = \langle E \rangle` },
			{ id: 'eq-lagrangian', tex: String.raw`\mathcal{L} = -\sum_i p_i \log p_i - \lambda\left(\sum_i p_i - 1\right) - \beta\left(\sum_i p_i E_i - \langle E \rangle\right)` },
			{ id: 'eq-solution', tex: String.raw`p_i = \frac{e^{-\beta E_i}}{Z}` },
			{ id: 'eq-beta', tex: String.raw`\beta = \frac{1}{kT}` },
			{ id: 'eq-final', tex: String.raw`p_i = \frac{e^{z_i/\tau}}{\sum_j e^{z_j/\tau}}` }
		];

		equations.forEach(({ id, tex }) => {
			const element = document.getElementById(id);
			if (element) {
				katex.default.render(tex, element, {
					displayMode: true,
					throwOnError: false
				});
			}
		});

		equationsRendered = true;
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
		integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
		crossorigin="anonymous"
	/>
</svelte:head>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
				<div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Understanding Softmax
					</h2>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						A journey through mathematics, physics, and machine learning
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (showAbout = true)}
						class="rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
					>
						About
					</button>
					<button
						onclick={onclose}
						class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Scrollable Content -->
			<div class="flex-1 overflow-y-auto p-8">
				<div class="prose prose-gray max-w-none dark:prose-invert">
					
					<!-- Introduction -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">What is Softmax?</h3>
						<p class="text-gray-700 dark:text-gray-300">
							The softmax function is one of the most fundamental tools in machine learning, working tirelessly behind the scenes in everything from image classification to language models. It transforms a vector of real numbers into a probability distribution, where each output is between 0 and 1, and all outputs sum to exactly 1.
						</p>
						
						<div class="my-6 rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 p-6 dark:from-blue-900/20 dark:to-emerald-900/20">
							<div id="eq-main" class="text-center"></div>
							<p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
								where τ (tau) is the temperature parameter
							</p>
						</div>
					</section>

					<!-- Historical Context -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Historical Origins</h3>
						
						<div class="mb-6">
							<h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Ludwig Boltzmann and Statistical Mechanics</h4>
							<div class="my-4 flex items-start gap-4">
								<img 
									src="https://upload.wikimedia.org/wikipedia/commons/archive/a/ad/20250304014327%21Boltzmann2.jpg" 
									alt="Ludwig Boltzmann"
									class="w-32 flex-shrink-0 rounded-lg shadow-md"
								/>
								<div>
									<p class="text-gray-700 dark:text-gray-300">
										In the late 19th century, physicist <strong>Ludwig Boltzmann</strong> studied how particles distribute themselves among different energy states at thermal equilibrium. He introduced the Boltzmann distribution:
									</p>
									<div id="eq-boltzmann" class="my-4 text-center"></div>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										where <em>k</em> is Boltzmann's constant, <em>T</em> is temperature, and <em>Z</em> is the partition function ensuring probabilities sum to 1.
									</p>
								</div>
							</div>
							<p class="text-gray-700 dark:text-gray-300">
								The connection to softmax becomes clear when we think of negative energy levels −E<sub>i</sub> as our logits z<sub>i</sub>. The Boltzmann distribution essentially becomes the softmax function, revealing a profound link between statistical mechanics and machine learning.
							</p>
						</div>

						<div class="mb-6">
							<h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Claude Shannon and Information Theory</h4>
							<div class="my-4 flex items-start gap-4">
								<img 
									src="https://upload.wikimedia.org/wikipedia/commons/9/98/C.E._Shannon._Tekniska_museet_43069_%28cropped%29.jpg" 
									alt="Claude Shannon"
									class="w-32 flex-shrink-0 rounded-lg shadow-md"
								/>
								<div class="flex-1">
									<p class="text-gray-700 dark:text-gray-300">
										In 1948, <strong>Claude Shannon</strong> published "A Mathematical Theory of Communication," revolutionizing our understanding of information. He introduced the concept of <em>entropy</em> to quantify uncertainty:
									</p>
									<div id="eq-entropy" class="my-4 text-center"></div>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										Shannon's entropy measures the average "surprise" or information content
									</p>
								</div>
							</div>
							<p class="mt-3 text-gray-700 dark:text-gray-300">
								A uniform distribution has maximum entropy (most uncertain), while a distribution concentrated on one outcome has zero entropy (perfectly certain). This concept became the bridge connecting physics to machine learning.
							</p>
						</div>

						<div class="mb-6">
							<h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">E.T. Jaynes and the Maximum Entropy Principle</h4>
							<div class="my-4 flex items-start gap-4">
								<img 
									src="https://upload.wikimedia.org/wikipedia/commons/b/b0/ETJaynes1.jpg" 
									alt="Edwin T. Jaynes"
									class="w-32 flex-shrink-0 rounded-lg shadow-md"
								/>
								<div class="flex-1">
									<p class="text-gray-700 dark:text-gray-300">
										In 1957, physicist <strong>Edwin T. Jaynes</strong> formalized the <em>principle of maximum entropy</em>, which states: given what we know, the best probability distribution is the one with the highest entropy (most uncertainty about what we don't know).
									</p>
								</div>
							</div>
							
							<div class="mt-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-900/20 dark:to-pink-900/20">
								<h5 class="font-semibold text-purple-900 dark:text-purple-300">The Remarkable Result:</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									When you maximize entropy subject to constraints on expected values, the solution is exactly the <strong>softmax function</strong>! This means softmax gives us the most unbiased, least presumptuous probability distribution possible given our knowledge (the logits).
								</p>
								<p class="mt-3 text-sm italic text-gray-600 dark:text-gray-400">
									"Softmax doesn't add information we don't have—it respects what we know while maximizing our uncertainty about everything else."
								</p>
							</div>

							<p class="mt-4 text-gray-700 dark:text-gray-300">
								This deep connection explains why softmax appears naturally in so many contexts: it's not just a convenient formula, but a principled way to reason about uncertainty. From Boltzmann's particles to Shannon's information to Jaynes's inference—softmax emerges as the fundamental solution.
							</p>
						</div>
					</section>

					<!-- Derivation from Maximum Entropy -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Deriving Softmax: Where Temperature Comes From</h3>
						<p class="text-gray-700 dark:text-gray-300">
							Now comes the beautiful part: we can derive the softmax function from first principles using the maximum entropy principle. This shows that temperature isn't arbitrary—it emerges naturally as a Lagrange multiplier.
						</p>

						<div class="mt-4 space-y-4">
							<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
								<h5 class="font-semibold text-gray-900 dark:text-gray-100">Step 1: Set Up the Problem</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									We want to find a probability distribution <em>p</em> that maximizes entropy:
								</p>
								<div id="eq-maxentropy" class="my-3"></div>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									subject to the constraint that probabilities sum to 1, and the expected energy is fixed:
								</p>
								<div id="eq-constraint" class="my-3"></div>
							</div>

							<div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<h5 class="font-semibold text-blue-900 dark:text-blue-300">Step 2: Lagrange Multipliers</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									We introduce Lagrange multipliers λ (for normalization) and <strong>β (which will become 1/T)</strong> for the energy constraint:
								</p>
								<div id="eq-lagrangian" class="my-3"></div>
							</div>

							<div class="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
								<h5 class="font-semibold text-emerald-900 dark:text-emerald-300">Step 3: Solve for p<sub>i</sub></h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Taking the derivative with respect to p<sub>i</sub> and setting to zero, we get:
								</p>
								<div id="eq-solution" class="my-3"></div>
								<p class="mt-3 text-sm text-gray-700 dark:text-gray-300">
									This is exactly the Boltzmann distribution! The multiplier emerges naturally from the math:
								</p>
								<div id="eq-beta" class="my-3"></div>
								<p class="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
									This is temperature!
								</p>
							</div>

							<div class="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-900/20 dark:to-pink-900/20">
								<h5 class="font-semibold text-purple-900 dark:text-purple-300">Step 4: Connection to Softmax</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									If we set E<sub>i</sub> = −z<sub>i</sub> (negative logits as energies) and kT = τ, we get:
								</p>
								<div id="eq-final" class="my-3"></div>
								<p class="mt-3 text-sm font-bold text-purple-900 dark:text-purple-300">
									This is the softmax function with temperature!
								</p>
							</div>
						</div>

						<p class="mt-4 text-gray-700 dark:text-gray-300">
							This derivation reveals something profound: <strong>temperature isn't just a parameter we add for convenience—it emerges naturally from the mathematical structure of maximizing entropy subject to constraints.</strong> It represents the strength of the constraint on expected values. This is why softmax is not just useful, but mathematically inevitable.
						</p>
					</section>

					<!-- Temperature Parameter -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Understanding Temperature in Depth</h3>
						<p class="text-gray-700 dark:text-gray-300">
							Now that we know temperature emerges as a Lagrange multiplier, let's explore what it actually controls in practice:
						</p>
						
						<div id="eq-temp" class="my-6 text-center"></div>

						<div class="my-4 space-y-3">
							<div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<strong class="text-blue-900 dark:text-blue-300">High Temperature (τ → ∞)</strong>
								<p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
									Creates a more uniform distribution. All options become nearly equally likely, regardless of input differences. Useful for exploration in reinforcement learning.
								</p>
							</div>
							<div class="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
								<strong class="text-emerald-900 dark:text-emerald-300">Low Temperature (τ → 0)</strong>
								<p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
									Creates a sharper, more peaked distribution. The highest value becomes dominant, approaching argmax behavior. Useful for confident predictions.
								</p>
							</div>
							<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-700/50">
								<strong class="text-gray-900 dark:text-gray-100">Standard (τ = 1)</strong>
								<p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
									The default softmax without temperature scaling, balancing between extremes.
								</p>
							</div>
						</div>

						<div class="mt-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
							<h5 class="font-semibold text-amber-900 dark:text-amber-300">Physical Intuition</h5>
							<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
								In physics, temperature controls the energy distribution of particles. At high temperatures, particles have more random, uniform energy distributions. At low temperatures, particles settle into lower energy states (more ordered). This analogy extends beautifully to machine learning, where temperature controls the "randomness" of predictions.
							</p>
						</div>
					</section>

					<!-- Mathematical Properties -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Key Mathematical Properties</h3>
						
						<div class="space-y-4">
							<div class="rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 dark:bg-gray-800/50">
								<h5 class="font-semibold text-gray-900 dark:text-gray-100">Differentiability</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Softmax is smooth and differentiable everywhere, which is essential for training neural networks using gradient-based methods like backpropagation.
								</p>
								<div id="eq-derivative" class="my-3 text-center text-sm"></div>
								<p class="text-xs text-gray-600 dark:text-gray-400">
									where δ<sub>ij</sub> is the Kronecker delta (1 if i = j, 0 otherwise)
								</p>
							</div>

							<div class="rounded-lg border-l-4 border-emerald-500 bg-gray-50 p-4 dark:bg-gray-800/50">
								<h5 class="font-semibold text-gray-900 dark:text-gray-100">Translation Invariance</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Adding a constant to all inputs doesn't change the output: σ(z + c) = σ(z). This property is crucial for numerical stability.
								</p>
							</div>

							<div class="rounded-lg border-l-4 border-purple-500 bg-gray-50 p-4 dark:bg-gray-800/50">
								<h5 class="font-semibold text-gray-900 dark:text-gray-100">Monotonicity</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Preserves the ordering of input values: if z<sub>i</sub> &gt; z<sub>j</sub>, then σ(z)<sub>i</sub> &gt; σ(z)<sub>j</sub>
								</p>
							</div>

							<div class="rounded-lg border-l-4 border-orange-500 bg-gray-50 p-4 dark:bg-gray-800/50">
								<h5 class="font-semibold text-gray-900 dark:text-gray-100">Positive Outputs</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Even if inputs are negative, outputs are always positive thanks to the exponential function.
								</p>
							</div>
						</div>
					</section>

					<!-- Applications -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Real-World Applications</h3>
						
						<div class="grid gap-4 md:grid-cols-2">
							<div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<h5 class="font-semibold text-blue-900 dark:text-blue-300">Computer Vision</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Final layer in CNNs for image classification. Converts raw network outputs (logits) into class probabilities like "80% cat, 15% dog, 5% rabbit."
								</p>
							</div>

							<div class="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
								<h5 class="font-semibold text-emerald-900 dark:text-emerald-300">Natural Language Processing</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Predicts next words in machine translation, sentiment analysis. Powers attention mechanisms in Transformers.
								</p>
							</div>

							<div class="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
								<h5 class="font-semibold text-purple-900 dark:text-purple-300">Reinforcement Learning</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Converts action values into selection probabilities, enabling stochastic policies that balance exploration vs exploitation.
								</p>
							</div>

							<div class="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
								<h5 class="font-semibold text-orange-900 dark:text-orange-300">Language Models</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Controls creativity in text generation via temperature scaling. Higher temperature = more creative, lower = more focused.
								</p>
							</div>
						</div>
					</section>

					<!-- Attention Mechanisms -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Attention Mechanisms & Transformers</h3>
						<p class="text-gray-700 dark:text-gray-300">
							In the revolutionary Transformer architecture, softmax plays a crucial role in self-attention mechanisms, allowing models to focus on relevant parts of the input.
						</p>

						<div class="my-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
							<h5 class="font-semibold text-gray-900 dark:text-gray-100">Self-Attention Process:</h5>
							<ol class="ml-4 mt-2 list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
								<li>Compute Queries (Q), Keys (K), and Values (V) from input embeddings</li>
								<li>Calculate attention scores: scores = QK<sup>⊤</sup> / √d<sub>k</sub></li>
								<li><strong>Apply Softmax</strong> to normalize scores into attention weights</li>
								<li>Compute weighted sum of values using attention weights</li>
							</ol>
						</div>
					</section>

					<!-- Cross-Entropy Loss -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Training with Cross-Entropy</h3>
						<p class="text-gray-700 dark:text-gray-300">
							When training neural networks, softmax is typically paired with cross-entropy loss, creating an effective learning objective:
						</p>

						<div id="eq-crossentropy" class="my-6 text-center"></div>

						<p class="text-sm text-gray-600 dark:text-gray-400">
							where <em>p</em> is the true distribution and <em>q</em> is the predicted distribution from softmax
						</p>

						<div class="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
							<p>• <strong>Probabilistic Interpretation:</strong> Outputs are directly interpretable as class probabilities</p>
							<p>• <strong>Smooth Gradients:</strong> Differentiability enables gradient-based optimization</p>
							<p>• <strong>Efficient Learning:</strong> Gradients have a convenient form for fast computation</p>
						</div>
					</section>

					<!-- Limitations -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">The Softmax Bottleneck</h3>
						<p class="text-gray-700 dark:text-gray-300">
							While powerful, softmax has limitations. The "softmax bottleneck" occurs when the rank of the output distribution's log-probabilities is limited by the hidden representation dimensions.
						</p>

						<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
							<h5 class="font-semibold text-red-900 dark:text-red-300">Signs of the Bottleneck:</h5>
							<ul class="ml-4 mt-2 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
								<li>Difficulty capturing multi-modal distributions</li>
								<li>Poor performance on rare classes</li>
								<li>Performance plateau despite model improvements</li>
							</ul>
						</div>

						<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
							<h5 class="font-semibold text-emerald-900 dark:text-emerald-300">Solutions:</h5>
							<ul class="ml-4 mt-2 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
								<li><strong>Mixture of Softmaxes (MoS):</strong> Use multiple softmax functions</li>
								<li><strong>Hierarchical Softmax:</strong> Organize classes in tree structure</li>
								<li><strong>Adaptive Softmax:</strong> Allocate capacity based on frequency</li>
								<li><strong>Sparsemax:</strong> Alternative that can produce exact zeros</li>
							</ul>
						</div>
					</section>

					<!-- Alternatives -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Beyond Softmax: Modern Alternatives</h3>
						
						<div class="space-y-4">
							<div class="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-900/20 dark:to-pink-900/20">
								<h5 class="font-semibold text-purple-900 dark:text-purple-300">Sparsemax</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Projects onto the probability simplex, producing sparse distributions with exact zeros. Particularly useful in attention mechanisms for more focused, interpretable attention.
								</p>
							</div>

							<div class="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-4 dark:from-blue-900/20 dark:to-cyan-900/20">
								<h5 class="font-semibold text-blue-900 dark:text-blue-300">Entmax</h5>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									Generalizes both softmax (α=1) and sparsemax (α=2), providing tunable sparsity. The parameter α controls the trade-off between smooth and sparse outputs.
								</p>
							</div>
						</div>
					</section>

					<!-- Future Directions -->
					<section class="mb-8">
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Future Perspectives</h3>
						<p class="text-gray-700 dark:text-gray-300">
							The softmax function continues to evolve with exciting research directions:
						</p>
						
						<div class="mt-4 grid gap-3 text-sm md:grid-cols-2">
							<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
								<strong class="text-gray-900 dark:text-gray-100">Quantum Computing</strong>
								<p class="mt-1 text-gray-600 dark:text-gray-400">Quantum analogues for quantum ML</p>
							</div>
							<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
								<strong class="text-gray-900 dark:text-gray-100">Neuromorphic Hardware</strong>
								<p class="mt-1 text-gray-600 dark:text-gray-400">Energy-efficient implementations</p>
							</div>
							<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
								<strong class="text-gray-900 dark:text-gray-100">Model Calibration</strong>
								<p class="mt-1 text-gray-600 dark:text-gray-400">Better uncertainty quantification</p>
							</div>
							<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
								<strong class="text-gray-900 dark:text-gray-100">Fairness & Ethics</strong>
								<p class="mt-1 text-gray-600 dark:text-gray-400">Unbiased decision-making</p>
							</div>
						</div>
					</section>

					<!-- Conclusion -->
					<section>
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Conclusion</h3>
						<p class="text-gray-700 dark:text-gray-300">
							From Boltzmann's work on particle energies in the 19th century to powering modern AI systems, the softmax function exemplifies the power of interdisciplinary thinking. It serves as a bridge between statistical mechanics, information theory, and machine learning—proving that great ideas transcend their original domains.
						</p>
					</section>

				</div>
			</div>
		</div>
	</div>
{/if}

<!-- About Modal -->
{#if showAbout}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
		transition:fade={{ duration: 200 }}
		onclick={(e) => { if (e.target === e.currentTarget) showAbout = false; }}
		onkeydown={(e) => { if (e.key === 'Escape') showAbout = false; }}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">About</h3>
				<button
					onclick={() => (showAbout = false)}
					class="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					aria-label="Close about dialog"
				>
					<svg class="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<p class="text-gray-700 dark:text-gray-300">
				This application was developed by <strong>Neo Mohsenvand</strong> for educational purposes.
			</p>
			<div class="mt-4 flex justify-end">
				<button
					onclick={() => (showAbout = false)}
					class="rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for modal content */
	.overflow-y-auto {
		scrollbar-width: thin;
	}

	.overflow-y-auto::-webkit-scrollbar {
		width: 8px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: rgb(243, 244, 246);
		border-radius: 4px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgb(209, 213, 219);
		border-radius: 4px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(156, 163, 175);
	}

	:global(.dark) .overflow-y-auto::-webkit-scrollbar-track {
		background: rgb(31, 41, 55);
	}

	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgb(75, 85, 99);
	}

	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(107, 114, 128);
	}

	/* KaTeX styling */
	:global(.prose) :global(.katex) {
		color: rgb(17, 24, 39);
	}

	:global(.dark .prose) :global(.katex) {
		color: rgb(243, 244, 246);
	}
</style>
