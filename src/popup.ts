import {
  type FeelingLevel,
  createInitialFeelingsState,
  feelingLevels,
  getSelectedFeelingLevel,
  selectFeelingLevel,
} from "./core/feelings";

const app = document.querySelector<HTMLDivElement>("#app");

let state = createInitialFeelingsState();

function renderLevelButton(level: FeelingLevel, selectedLevel: FeelingLevel): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "level-button";
  button.dataset.selected = String(level.id === selectedLevel.id);
  button.setAttribute("aria-pressed", String(level.id === selectedLevel.id));
  button.style.setProperty("--level-color", level.color);

  const face = document.createElement("span");
  face.className = "level-face";
  face.textContent = level.face;

  const label = document.createElement("span");
  label.className = "level-label";
  label.textContent = level.label;

  button.append(face, label);
  button.addEventListener("click", () => {
    state = selectFeelingLevel(state, level.id);
    render();
  });

  return button;
}

function renderCards(level: FeelingLevel): HTMLUListElement {
  const list = document.createElement("ul");
  list.className = "card-list";

  for (const cardText of level.cards) {
    const item = document.createElement("li");
    item.className = "care-card";
    item.textContent = cardText;
    list.append(item);
  }

  return list;
}

function render(): void {
  if (!app) return;

  const selectedLevel = getSelectedFeelingLevel(state);
  app.replaceChildren();

  const style = document.createElement("style");
  style.textContent = `
    .popup-shell { display: grid; gap: 12px; }
    .level-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .level-button {
      appearance: none;
      min-width: 0;
      border: 2px solid transparent;
      border-radius: 8px;
      background: color-mix(in srgb, var(--level-color) 22%, white);
      padding: 8px 4px;
      display: grid;
      gap: 4px;
      justify-items: center;
      cursor: pointer;
      font: inherit;
    }
    .level-button[data-selected="true"] {
      border-color: var(--level-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--level-color) 24%, white);
    }
    .level-face { font-size: 24px; line-height: 1; }
    .level-label { font-size: 11px; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
    .selected-heading { margin: 0; font-size: 16px; }
    .card-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .care-card {
      border-left: 6px solid ${selectedLevel.color};
      border-radius: 8px;
      background: #f7f7f7;
      padding: 10px 12px;
      font-size: 14px;
      line-height: 1.35;
    }
  `;

  const shell = document.createElement("main");
  shell.className = "popup-shell";

  const levelGrid = document.createElement("section");
  levelGrid.className = "level-grid";
  levelGrid.setAttribute("aria-label", "今の気持ち");
  levelGrid.append(...feelingLevels.map((level) => renderLevelButton(level, selectedLevel)));

  const selectedHeading = document.createElement("h4");
  selectedHeading.className = "selected-heading";
  selectedHeading.textContent = `${selectedLevel.face} ${selectedLevel.label} のとき`;

  const cardsSection = document.createElement("section");
  cardsSection.setAttribute("aria-label", "こうするといい");
  cardsSection.append(selectedHeading, renderCards(selectedLevel));

  shell.append(levelGrid, cardsSection);
  app.append(style, shell);
}

render();
