const demoDecks = [
	{
		id: 'html-core',
		name: 'HTML5 Core',
		cards: [
			{ id: 'h1', front: 'What is the purpose of <!DOCTYPE html>?', back: 'It informs the browser that the document is an HTML5 document.', history: [] },
			{ id: 'h3', front: 'What are Semantic Elements?', back: 'Tags that clearly describe their meaning (e.g., <header>, <article>).', history: [] }
		]
	},
	{
		id: 'js-basics',
		name: 'JavaScript Basics',
		cards: [
			{ id: 'j1', front: 'Difference between == and ===?', back: '== checks value. === checks value AND type.', history: [] }
		]
	}
];

const app = {
	data: [],
	currentDeckId: null,
	studyQueue: [],

	init() {
		try {
			this.data = JSON.parse(localStorage.getItem('flashMaster') || '[]');
		} catch (e) {
			this.data = [];
		}

		if (!this.data.length) {
			this.data = JSON.parse(JSON.stringify(demoDecks));
			this.save();
		}

		this.renderDecks();
		this.renderStats();
	},

	// --- Utilities ---
	escapeHTML(str) {
		if (!str) return "";
		return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	},

	save() {
		localStorage.setItem('flashMaster', JSON.stringify(this.data));
		this.renderDecks();
		this.renderStats();
	},

	getDeck() { return this.data.find(d => d.id === this.currentDeckId); },

	// --- Navigation ---
	openSection(id) {
		document.querySelectorAll('.dynamic-section').forEach(el => el.classList.remove('active'));
		const el = document.getElementById(id);
		el.classList.add('active');
		setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
	},

	closeSection(id) {
		document.getElementById(id).classList.remove('active');
		document.getElementById('view-decks').scrollIntoView({ behavior: 'smooth' });
	},

	resetView() {
		document.querySelectorAll('.dynamic-section').forEach(el => el.classList.remove('active'));
		window.scrollTo({ top: 0, behavior: 'smooth' });
	},

	// --- Deck Management ---
	createDeck() {
		const name = document.getElementById('new-deck-name').value;
		if (name) {
			this.data.push({ id: Date.now().toString(), name, cards: [] });
			this.save();
			document.getElementById('new-deck-name').value = '';
			bootstrap.Modal.getInstance(document.getElementById('deckModal')).hide();
		}
	},

	deleteDeck(id) {
		if (confirm('Delete this deck and all its cards?')) {
			this.data = this.data.filter(d => d.id !== id);
			this.save();
		}
	},

	manageDeck(id) {
		this.currentDeckId = id;
		this.renderCards();
		this.openSection('view-manage');
	},

	// --- Card Management ---
	renderCards() {
		const deck = this.getDeck();
		if (!deck) return;
		document.getElementById('manage-deck-title').innerText = deck.name;
		const tbody = document.getElementById('card-list-body');

		if (deck.cards.length === 0) {
			tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No cards yet.</td></tr>';
			return;
		}

		tbody.innerHTML = deck.cards.map(c => `
                    <tr>
                        <td title="${this.escapeHTML(c.front)}">${this.escapeHTML(c.front)}</td>
                        <td title="${this.escapeHTML(c.back)}">${this.escapeHTML(c.back)}</td>
                        <td><span class="badge bg-light text-dark border">${c.history?.length || 0}</span></td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-link text-decoration-none" onclick="app.openCardModal('${c.id}')">Edit</button>
                            <button class="btn btn-sm btn-link text-danger text-decoration-none" onclick="app.deleteCard('${c.id}')">Delete</button>
                        </td>
                    </tr>`).join('');
	},

	openCardModal(id = '') {
		const card = id ? this.getDeck().cards.find(c => c.id === id) : { front: '', back: '' };
		document.getElementById('card-edit-id').value = id;
		document.getElementById('card-front-input').value = card.front;
		document.getElementById('card-back-input').value = card.back;
		new bootstrap.Modal(document.getElementById('cardModal')).show();
	},

	saveCard() {
		const id = document.getElementById('card-edit-id').value;
		const front = document.getElementById('card-front-input').value.trim();
		const back = document.getElementById('card-back-input').value.trim();

		if (!front || !back) return alert("Please fill both sides");

		const deck = this.getDeck();
		if (id) {
			Object.assign(deck.cards.find(c => c.id === id), { front, back });
		} else {
			deck.cards.push({ id: Date.now().toString(), front, back, history: [] });
		}

		this.save();
		this.renderCards();
		bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
	},

	deleteCard(id) {
		if (!confirm("Delete this card?")) return;
		const deck = this.getDeck();
		deck.cards = deck.cards.filter(c => c.id !== id);
		this.save();
		this.renderCards();
	},

	// --- Session Logic ---
	startStudy(id) {
		this.currentDeckId = id;
		this.studyQueue = [...this.getDeck().cards].sort(() => Math.random() - 0.5);

		if (!this.studyQueue.length) return alert('This deck is empty!');

		this.openSection('view-study');
		document.getElementById('study-complete').classList.add('d-none');
		document.getElementById('flashcard-scene').classList.remove('d-none');
		this.nextCard();
	},

	nextCard() {
		if (!this.studyQueue.length) {
			document.getElementById('flashcard-scene').classList.add('d-none');
			document.getElementById('rating-controls').classList.add('d-none');
			document.getElementById('study-complete').classList.remove('d-none');
			return;
		}

		const card = this.studyQueue[0];
		const flashcardEl = document.getElementById('active-flashcard');

		flashcardEl.classList.remove('is-flipped');
		document.getElementById('rating-controls').classList.add('d-none');

		setTimeout(() => {
			document.getElementById('study-progress').innerText = `Remaining: ${this.studyQueue.length}`;
			document.getElementById('card-front-text').innerText = card.front;
			document.getElementById('card-back-text').innerText = card.back;
		}, 300);
	},

	flipCard() {
		const el = document.getElementById('active-flashcard');
		el.classList.toggle('is-flipped');
		if (el.classList.contains('is-flipped')) {
			document.getElementById('rating-controls').classList.remove('d-none');
		} else {
			document.getElementById('rating-controls').classList.add('d-none');
		}
	},

	rateCard(rating) {
		const current = this.studyQueue.shift();
		const realCard = this.getDeck().cards.find(c => c.id === current.id);
		if (!realCard.history) realCard.history = [];
		realCard.history.push({ date: Date.now(), rating });

		this.save();
		this.nextCard();
	},

	// --- Visual Renderers ---
	renderDecks() {
		const container = document.getElementById('deck-list-container');
		if (!this.data.length) {
			container.innerHTML = '<div class="col-12 text-center text-muted py-5">No decks found.</div>';
			return;
		}
		container.innerHTML = this.data.map(d => `
                    <div class="col-md-4">
                        <div class="card h-100 shadow-sm border-0 transition">
                            <div class="card-body p-4">
                                <h5 class="fw-bold mb-1">${this.escapeHTML(d.name)}</h5>
                                <p class="text-muted small mb-4">${d.cards.length} Cards</p>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary" onclick="app.startStudy('${d.id}')">Study Now</button>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-light border flex-grow-1 btn-sm" onclick="app.manageDeck('${d.id}')">Manage</button>
                                        <button class="btn btn-outline-danger btn-sm" onclick="app.deleteDeck('${d.id}')"><i class="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`).join('');
	},

	renderStats() {
		const allCards = this.data.flatMap(d => d.cards);
		const allHistory = allCards.flatMap(c => c.history || []);

		const good = allHistory.filter(h => h.rating !== 'Hard').length;
		const acc = allHistory.length ? Math.round((good / allHistory.length) * 100) : 0;

		document.getElementById('accuracy-score').innerText = acc + '%';
		document.getElementById('streak-count').innerText = allHistory.length;

		const chartEl = document.getElementById('activity-chart');
		const days = Array.from({ length: 7 }, (_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (6 - i));
			return d.toLocaleDateString();
		});

		const counts = days.map(day =>
			allHistory.filter(h => new Date(h.date).toLocaleDateString() === day).length
		);

		const max = Math.max(...counts, 1);

		chartEl.innerHTML = days.map((day, i) => `
                    <div class="bar-group">
                        <div class="bar" style="height: ${(counts[i] / max) * 100}%" data-count="${counts[i]}"></div>
                        <span class="bar-label">${day.split('/')[0]}/${day.split('/')[1]}</span>
                    </div>
                `).join('');
	},

	confirmReset() {
		if (confirm('Delete ALL data?')) {
			localStorage.clear();
			location.reload();
		}
	}
};

app.init();
