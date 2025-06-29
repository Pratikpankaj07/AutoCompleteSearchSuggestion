// Trie Node definition
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
    const suggestionsDiv = document.getElementById("suggestions");
    const clearBtn = document.getElementById("clearHistoryBtn");

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
        suggestionsDiv.innerHTML = "";

        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

        // Show history if input is empty
        if (query === "") {
            if (history.length > 0) {
                const label = document.createElement("div");
                label.classList.add("history-label");
                label.textContent = "Recent Searches";
                suggestionsDiv.appendChild(label);

                for (let item of history) {
                    const div = document.createElement("div");
                    div.classList.add("history-item");
                    div.textContent = item;
                    div.addEventListener("click", () => {
                        searchInput.value = item;
                        saveToHistory(item);
                        suggestionsDiv.style.display = "none";
                        searchInput.dispatchEvent(new Event('input'));
                    });
                    suggestionsDiv.appendChild(div);
                }
                suggestionsDiv.style.display = "block";
                clearBtn.style.display = "block";
            } else {
                suggestionsDiv.style.display = "none";
                clearBtn.style.display = "none";
            }
            return;
        }

        const suggestions = trie.getWordsWithPrefix(query);
        if (suggestions.length === 0) {
            suggestionsDiv.style.display = "none";
            return;
        }

        for (let suggestion of suggestions) {
            const item = document.createElement("div");
            item.classList.add("suggestion-item");
            item.innerHTML = `<strong>${query}</strong>${suggestion.slice(query.length)}`;
            item.addEventListener("click", () => {
                searchInput.value = suggestion;
                saveToHistory(suggestion);
                suggestionsDiv.style.display = "none";
            });
            suggestionsDiv.appendChild(item);
        }
        suggestionsDiv.style.display = "block";
        clearBtn.style.display = "block";
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

    clearBtn.addEventListener("click", () => {
        localStorage.removeItem("searchHistory");
        suggestionsDiv.style.display = "none";
        clearBtn.style.display = "none";
    });
    
    searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const visibleSuggestions = document.querySelectorAll(".suggestion-item");
        if (visibleSuggestions.length > 0) {
            e.preventDefault(); // prevent form submission if any
            const firstSuggestion = visibleSuggestions[0].textContent;
            searchInput.value = firstSuggestion;
            saveToHistory(firstSuggestion);
            suggestionsDiv.style.display = "none";
        }
    }
});

};
