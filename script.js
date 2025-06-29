class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (let ch of word) {
            if (!node.children[ch]) {
                node.children[ch] = new TrieNode();
            }
            node = node.children[ch];
        }
        node.isEndOfWord = true;
    }

    getWordsWithPrefix(prefix) {
        let node = this.root;
        for (let ch of prefix) {
            if (!node.children[ch]) {
                return [];
            }
            node = node.children[ch];
        }
        return this.collectWords(node, prefix);
    }

    collectWords(node, prefix) {
        let results = [];
        if (node.isEndOfWord) {
            results.push(prefix);
        }
        for (let ch in node.children) {
            results = results.concat(this.collectWords(node.children[ch], prefix + ch));
        }
        return results;
    }
}

window.onload = () => {
    const trie = new Trie();
    const searchInput = document.getElementById("searchInput");
    const suggestionList = document.getElementById("suggestionList");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    const clearBtn = document.getElementById("clearBtn");

    const MAX_HISTORY = 5;

    fetch('words.txt')
        .then(response => response.text())
        .then(text => {
            const words = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
            for (let word of words) {
                trie.insert(word);
            }
        })
        .catch(err => console.error("Error loading word list:", err));

    function saveToHistory(searchTerm) {
        let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
        history = history.filter(h => h !== searchTerm);
        history.unshift(searchTerm);
        if (history.length > MAX_HISTORY) {
            history.pop();
        }
        localStorage.setItem("searchHistory", JSON.stringify(history));
    }

    function buildSuggestions(query) {
        suggestionList.innerHTML = "";

        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

        // Show history if input is empty
        if (query === "") {
            if (history.length > 0) {
                for (let item of history) {
                    const li = document.createElement("li");
                    li.textContent = item;
                    li.addEventListener("click", () => {
                        searchInput.value = item;
                        saveToHistory(item);
                        suggestionList.style.display = "none";
                        searchInput.dispatchEvent(new Event('input'));
                    });
                    suggestionList.appendChild(li);
                }
                suggestionList.style.display = "block";
            } else {
                suggestionList.style.display = "none";
            }
            return;
        }

        const suggestions = trie.getWordsWithPrefix(query);
        if (suggestions.length === 0) {
            suggestionList.style.display = "none";
            return;
        }

        for (let suggestion of suggestions) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${query}</strong>${suggestion.slice(query.length)}`;
            li.addEventListener("click", () => {
                searchInput.value = suggestion;
                saveToHistory(suggestion);
                suggestionList.style.display = "none";
            });
            suggestionList.appendChild(li);
        }
        suggestionList.style.display = "block";
    }

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        buildSuggestions(query);
    });

    searchInput.addEventListener("focus", () => {
        if (searchInput.value === "") {
            buildSuggestions("");
        }
    });

    clearHistoryBtn.addEventListener("click", () => {
        localStorage.removeItem("searchHistory");
        suggestionList.style.display = "none";
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = '';
        searchInput.focus();
        buildSuggestions('');
    });

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const visibleSuggestions = document.querySelectorAll("#suggestionList li");
            if (visibleSuggestions.length > 0) {
                e.preventDefault();
                const firstSuggestion = visibleSuggestions[0].textContent;
                searchInput.value = firstSuggestion;
                saveToHistory(firstSuggestion);
                suggestionList.style.display = "none";
            } else if (searchInput.value.trim() !== "") {
                saveToHistory(searchInput.value.trim());
            }
        }
    });
};
