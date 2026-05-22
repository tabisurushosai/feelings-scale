import {
  type FeelingLevel,
  type FeelingLevelId,
  type FeelingLevelLabelMap,
  type FeelingsState,
  addCareCard,
  clearFeelingHistory,
  createFeelingsViewModel,
  createInitialFeelingsState,
  enterChildMode,
  enterParentMode,
  isValidParentPin,
  removeCareCard,
  recordFeelingSelection,
  setParentPin,
  setFeelingHistoryRetention,
  updateCareCard,
} from "./core/feelings";
import type { CareCardPresetMap } from "./core/careCards";
import { loadFeelingsState, saveFeelingsState } from "./core/feelingsPersistence";
import { store } from "./storage";

const app = document.querySelector<HTMLDivElement>("#app");
const appTitle = document.querySelector<HTMLElement>("[data-i18n='appTitle']");

interface PopupMessages {
  appTitle: string;
  levelSelectAria: (levelLabel: string) => string;
  cardInputAria: (index: number) => string;
  deleteButton: string;
  deleteCardAria: (cardText: string) => string;
  addCardPlaceholder: string;
  addCardAria: string;
  addButton: string;
  currentFeelingAria: string;
  selectedHeading: (face: string, levelLabel: string) => string;
  careCardsAria: string;
  historyAria: string;
  keepHistory: string;
  clearHistory: string;
  emptyHistory: string;
  modeAria: string;
  parentMode: string;
  childMode: string;
  switchToChildMode: string;
  switchToParentMode: string;
  pinPlaceholder: string;
  newPinPlaceholder: string;
  parentPinAria: string;
  newParentPinAria: string;
  unlockButton: string;
  createButton: string;
  changePinButton: string;
  invalidPinMessage: string;
  wrongPinMessage: string;
}

const messages = createPopupMessages();
const levelLabels = createLevelLabels();
const defaultCareCardsByLevel = createLocalizedDefaultCareCardsByLevel();

let state: FeelingsState = createInitialFeelingsState(defaultCareCardsByLevel);
let parentModeMessage = "";

function createPopupMessages(): PopupMessages {
  return {
    appTitle: t("appTitle"),
    levelSelectAria: (levelLabel) => t("levelSelectAria", levelLabel),
    cardInputAria: (index) => t("cardInputAria", String(index)),
    deleteButton: t("deleteButton"),
    deleteCardAria: (cardText) => t("deleteCardAria", cardText),
    addCardPlaceholder: t("addCardPlaceholder"),
    addCardAria: t("addCardAria"),
    addButton: t("addButton"),
    currentFeelingAria: t("currentFeelingAria"),
    selectedHeading: (face, levelLabel) => t("selectedHeading", [face, levelLabel]),
    careCardsAria: t("careCardsAria"),
    historyAria: t("historyAria"),
    keepHistory: t("keepHistory"),
    clearHistory: t("clearHistory"),
    emptyHistory: t("emptyHistory"),
    modeAria: t("modeAria"),
    parentMode: t("parentMode"),
    childMode: t("childMode"),
    switchToChildMode: t("switchToChildMode"),
    switchToParentMode: t("switchToParentMode"),
    pinPlaceholder: t("pinPlaceholder"),
    newPinPlaceholder: t("newPinPlaceholder"),
    parentPinAria: t("parentPinAria"),
    newParentPinAria: t("newParentPinAria"),
    unlockButton: t("unlockButton"),
    createButton: t("createButton"),
    changePinButton: t("changePinButton"),
    invalidPinMessage: t("invalidPinMessage"),
    wrongPinMessage: t("wrongPinMessage"),
  };
}

function createLevelLabels(): FeelingLevelLabelMap {
  return {
    1: t("level1Label"),
    2: t("level2Label"),
    3: t("level3Label"),
    4: t("level4Label"),
    5: t("level5Label"),
  };
}

function createLocalizedDefaultCareCardsByLevel(): CareCardPresetMap {
  return {
    1: [t("careCard1_1"), t("careCard1_2"), t("careCard1_3")],
    2: [t("careCard2_1"), t("careCard2_2"), t("careCard2_3")],
    3: [t("careCard3_1"), t("careCard3_2"), t("careCard3_3")],
    4: [t("careCard4_1"), t("careCard4_2"), t("careCard4_3")],
    5: [t("careCard5_1"), t("careCard5_2"), t("careCard5_3")],
  };
}

function t(messageName: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(messageName, substitutions) || messageName;
}

function renderLevelButton(level: FeelingLevel, selectedLevel: FeelingLevel): HTMLButtonElement {
  const isSelected = level.id === selectedLevel.id;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "level-button";
  button.dataset.selected = String(isSelected);
  button.setAttribute("aria-pressed", String(isSelected));
  button.setAttribute("aria-label", messages.levelSelectAria(level.label));
  button.style.setProperty("--level-color", level.color);

  const colorBand = document.createElement("span");
  colorBand.className = "level-color";
  colorBand.setAttribute("aria-hidden", "true");

  const face = document.createElement("span");
  face.className = "level-face";
  face.textContent = level.face;

  const number = document.createElement("span");
  number.className = "level-number";
  number.textContent = String(level.id);

  const label = document.createElement("span");
  label.className = "level-label";
  label.textContent = level.label;

  button.append(colorBand, face, number, label);
  button.addEventListener("click", () => {
    void handleLevelSelect(level.id);
  });

  return button;
}

function renderCards(levelId: FeelingLevelId, cardTexts: string[], canEditCareCards: boolean): HTMLElement {
  if (!canEditCareCards) {
    const list = document.createElement("ul");
    list.className = "care-card-list";

    for (const cardText of cardTexts) {
      const item = document.createElement("li");
      item.className = "care-card-readonly";
      item.textContent = cardText;
      list.append(item);
    }

    return list;
  }

  const editor = document.createElement("div");
  editor.className = "card-editor";

  for (const [index, cardText] of cardTexts.entries()) {
    const row = document.createElement("div");
    row.className = "care-card";

    const input = document.createElement("input");
    input.className = "card-input";
    input.type = "text";
    input.value = cardText;
    input.setAttribute("aria-label", messages.cardInputAria(index + 1));
    input.addEventListener("change", () => {
      void handleCareCardUpdate(levelId, index, input.value);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "card-delete";
    deleteButton.textContent = messages.deleteButton;
    deleteButton.setAttribute("aria-label", messages.deleteCardAria(cardText));
    deleteButton.addEventListener("click", () => {
      void handleCareCardRemove(levelId, index);
    });

    row.append(input, deleteButton);
    editor.append(row);
  }

  const addForm = document.createElement("form");
  addForm.className = "card-add-form";

  const addInput = document.createElement("input");
  addInput.className = "card-input";
  addInput.type = "text";
  addInput.placeholder = messages.addCardPlaceholder;
  addInput.setAttribute("aria-label", messages.addCardAria);

  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.className = "card-add";
  addButton.textContent = messages.addButton;

  addForm.append(addInput, addButton);
  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleCareCardAdd(levelId, addInput.value);
  });

  editor.append(addForm);
  return editor;
}

function render(): void {
  if (!app) return;

  const viewModel = createFeelingsViewModel(state, levelLabels);
  const {
    levels,
    selectedLevel,
    careCards,
    shouldKeepHistory,
    feelingHistory,
    hasHistory,
    mode,
    hasParentPin,
    canEditCareCards,
  } = viewModel;
  app.replaceChildren();

  const style = document.createElement("style");
  style.textContent = `
    .popup-shell { display: grid; gap: 12px; }
    .mode-panel {
      display: grid;
      gap: 8px;
      border: 1px solid #e2e2e2;
      border-radius: 8px;
      background: #fbfbfb;
      padding: 9px;
    }
    .mode-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .mode-label {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.3;
    }
    .mode-form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
    }
    .pin-input {
      min-width: 0;
      box-sizing: border-box;
      border: 1px solid #d8d8d8;
      border-radius: 6px;
      padding: 8px 9px;
      font: inherit;
      font-size: 14px;
      line-height: 1.35;
    }
    .mode-button {
      border: 1px solid #cfcfcf;
      border-radius: 6px;
      background: white;
      padding: 8px 10px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .mode-message {
      margin: 0;
      color: #9a3412;
      font-size: 12px;
      line-height: 1.35;
    }
    .level-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .level-button {
      appearance: none;
      min-width: 0;
      border: 2px solid transparent;
      border-radius: 8px;
      background: color-mix(in srgb, var(--level-color) 22%, white);
      padding: 0 4px 8px;
      display: grid;
      grid-template-rows: 7px auto auto 1fr;
      gap: 3px;
      justify-items: center;
      cursor: pointer;
      font: inherit;
      min-height: 92px;
    }
    .level-button[data-selected="true"] {
      border-color: var(--level-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--level-color) 24%, white);
    }
    .level-button:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--level-color) 42%, white);
      outline-offset: 2px;
    }
    .level-color {
      width: calc(100% + 8px);
      height: 7px;
      border-radius: 6px 6px 0 0;
      background: var(--level-color);
    }
    .level-face { font-size: 24px; line-height: 1; }
    .level-number {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: white;
      color: #222;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    }
    .level-label { font-size: 11px; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
    .selected-heading { margin: 0; font-size: 16px; }
    .care-card-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .care-card-readonly {
      border-left: 6px solid ${selectedLevel.color};
      border-radius: 8px;
      background: #f7f7f7;
      padding: 9px 10px;
      font-size: 14px;
      line-height: 1.35;
    }
    .card-editor { display: grid; gap: 8px; }
    .care-card {
      border-left: 6px solid ${selectedLevel.color};
      border-radius: 8px;
      background: #f7f7f7;
      padding: 8px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .card-input {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #d8d8d8;
      border-radius: 6px;
      padding: 8px 9px;
      font-size: 14px;
      line-height: 1.35;
      font-family: inherit;
    }
    .card-delete,
    .card-add {
      border: 1px solid #cfcfcf;
      border-radius: 6px;
      background: white;
      padding: 8px 10px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .card-add-form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
    }
    .history-panel {
      display: grid;
      gap: 8px;
      border-top: 1px solid #e4e4e4;
      padding-top: 10px;
    }
    .history-controls {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .history-toggle {
      display: flex;
      gap: 7px;
      align-items: center;
      min-width: 0;
      font-size: 13px;
      line-height: 1.35;
    }
    .history-toggle input { flex: 0 0 auto; }
    .history-clear {
      border: 1px solid #cfcfcf;
      border-radius: 6px;
      background: white;
      padding: 7px 9px;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }
    .history-list {
      display: grid;
      gap: 5px;
      margin: 0;
      padding: 0;
      list-style: none;
      max-height: 120px;
      overflow: auto;
    }
    .history-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 6px;
      align-items: center;
      border-left: 5px solid var(--history-color);
      border-radius: 6px;
      background: #fafafa;
      padding: 6px 7px;
      font-size: 12px;
      line-height: 1.25;
    }
    .history-empty {
      margin: 0;
      color: #666;
      font-size: 12px;
      line-height: 1.35;
    }
  `;

  const shell = document.createElement("main");
  shell.className = "popup-shell";

  const modePanel = renderModePanel(mode, hasParentPin);

  const levelGrid = document.createElement("section");
  levelGrid.className = "level-grid";
  levelGrid.setAttribute("aria-label", messages.currentFeelingAria);
  levelGrid.append(...levels.map((level) => renderLevelButton(level, selectedLevel)));

  const selectedHeading = document.createElement("h4");
  selectedHeading.className = "selected-heading";
  selectedHeading.textContent = messages.selectedHeading(selectedLevel.face, selectedLevel.label);

  const cardsSection = document.createElement("section");
  cardsSection.setAttribute("aria-label", messages.careCardsAria);
  cardsSection.append(selectedHeading, renderCards(selectedLevel.id, careCards, canEditCareCards));

  const historySection = document.createElement("section");
  historySection.className = "history-panel";
  historySection.setAttribute("aria-label", messages.historyAria);

  const historyControls = document.createElement("div");
  historyControls.className = "history-controls";

  const historyLabel = document.createElement("label");
  historyLabel.className = "history-toggle";

  const historyCheckbox = document.createElement("input");
  historyCheckbox.type = "checkbox";
  historyCheckbox.checked = shouldKeepHistory;
  historyCheckbox.disabled = mode !== "parent";
  historyCheckbox.addEventListener("change", () => {
    void handleHistoryRetentionChange(historyCheckbox.checked);
  });

  const historyToggleText = document.createElement("span");
  historyToggleText.textContent = messages.keepHistory;

  historyLabel.append(historyCheckbox, historyToggleText);

  const clearHistoryButton = document.createElement("button");
  clearHistoryButton.type = "button";
  clearHistoryButton.className = "history-clear";
  clearHistoryButton.textContent = messages.clearHistory;
  clearHistoryButton.disabled = mode !== "parent" || !hasHistory;
  clearHistoryButton.addEventListener("click", () => {
    void handleHistoryClear();
  });

  historyControls.append(historyLabel, clearHistoryButton);
  historySection.append(historyControls);

  if (hasHistory) {
    const historyList = document.createElement("ul");
    historyList.className = "history-list";

    const recentHistory = feelingHistory.slice(-10).reverse();
    for (const historyItem of recentHistory) {
      const item = document.createElement("li");
      item.className = "history-item";
      item.style.setProperty("--history-color", historyItem.level.color);

      const face = document.createElement("span");
      face.textContent = historyItem.level.face;

      const label = document.createElement("span");
      label.textContent = historyItem.level.label;

      const time = document.createElement("time");
      time.dateTime = historyItem.selectedAt;
      time.textContent = formatHistoryTime(historyItem.selectedAt);

      item.append(face, label, time);
      historyList.append(item);
    }

    historySection.append(historyList);
  } else {
    const emptyHistory = document.createElement("p");
    emptyHistory.className = "history-empty";
    emptyHistory.textContent = messages.emptyHistory;
    historySection.append(emptyHistory);
  }

  shell.append(modePanel, levelGrid, cardsSection, historySection);
  app.append(style, shell);
}

function renderModePanel(mode: string, hasParentPin: boolean): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "mode-panel";
  panel.setAttribute("aria-label", messages.modeAria);

  const row = document.createElement("div");
  row.className = "mode-row";

  const label = document.createElement("p");
  label.className = "mode-label";
  label.textContent = mode === "parent" ? messages.parentMode : messages.childMode;

  const switchButton = document.createElement("button");
  switchButton.type = "button";
  switchButton.className = "mode-button";
  switchButton.textContent = mode === "parent" ? messages.switchToChildMode : messages.switchToParentMode;

  row.append(label, switchButton);
  panel.append(row);

  if (mode === "parent") {
    switchButton.addEventListener("click", () => {
      void handleEnterChildMode();
    });
    panel.append(renderPinChangeForm());
  } else {
    switchButton.disabled = true;
    panel.append(renderParentUnlockForm(hasParentPin));
  }

  if (parentModeMessage) {
    const message = document.createElement("p");
    message.className = "mode-message";
    message.textContent = parentModeMessage;
    panel.append(message);
  }

  return panel;
}

function renderParentUnlockForm(hasParentPin: boolean): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "mode-form";

  const pinInput = document.createElement("input");
  pinInput.className = "pin-input";
  pinInput.type = "password";
  pinInput.inputMode = "numeric";
  pinInput.pattern = "\\d{4}";
  pinInput.maxLength = 4;
  pinInput.placeholder = hasParentPin ? messages.pinPlaceholder : messages.newPinPlaceholder;
  pinInput.setAttribute("aria-label", hasParentPin ? messages.parentPinAria : messages.newParentPinAria);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "mode-button";
  submitButton.textContent = hasParentPin ? messages.unlockButton : messages.createButton;

  form.append(pinInput, submitButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleEnterParentMode(pinInput.value);
  });

  return form;
}

function renderPinChangeForm(): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "mode-form";

  const pinInput = document.createElement("input");
  pinInput.className = "pin-input";
  pinInput.type = "password";
  pinInput.inputMode = "numeric";
  pinInput.pattern = "\\d{4}";
  pinInput.maxLength = 4;
  pinInput.placeholder = messages.newPinPlaceholder;
  pinInput.setAttribute("aria-label", messages.newParentPinAria);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "mode-button";
  submitButton.textContent = messages.changePinButton;

  form.append(pinInput, submitButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleParentPinChange(pinInput.value);
  });

  return form;
}

async function handleLevelSelect(levelId: FeelingLevelId): Promise<void> {
  parentModeMessage = "";
  state = recordFeelingSelection(state, levelId, new Date().toISOString());
  render();
  await saveFeelingsState(store, state);
}

async function handleHistoryRetentionChange(shouldKeepHistory: boolean): Promise<void> {
  parentModeMessage = "";
  state = setFeelingHistoryRetention(state, shouldKeepHistory);
  render();
  await saveFeelingsState(store, state);
}

async function handleHistoryClear(): Promise<void> {
  parentModeMessage = "";
  state = clearFeelingHistory(state);
  render();
  await saveFeelingsState(store, state);
}

async function handleCareCardAdd(levelId: FeelingLevelId, cardText: string): Promise<void> {
  parentModeMessage = "";
  state = addCareCard(state, levelId, cardText);
  render();
  await saveFeelingsState(store, state);
}

async function handleCareCardUpdate(
  levelId: FeelingLevelId,
  cardIndex: number,
  cardText: string,
): Promise<void> {
  parentModeMessage = "";
  state = updateCareCard(state, levelId, cardIndex, cardText);
  render();
  await saveFeelingsState(store, state);
}

async function handleCareCardRemove(levelId: FeelingLevelId, cardIndex: number): Promise<void> {
  parentModeMessage = "";
  state = removeCareCard(state, levelId, cardIndex);
  render();
  await saveFeelingsState(store, state);
}

async function handleEnterParentMode(parentPin: string): Promise<void> {
  if (!isValidParentPin(parentPin.trim())) {
    parentModeMessage = messages.invalidPinMessage;
    render();
    return;
  }

  const nextState = enterParentMode(state, parentPin);
  if (nextState.mode !== "parent") {
    parentModeMessage = messages.wrongPinMessage;
    render();
    return;
  }

  parentModeMessage = "";
  state = nextState;
  render();
  await saveFeelingsState(store, state);
}

async function handleEnterChildMode(): Promise<void> {
  parentModeMessage = "";
  state = enterChildMode(state);
  render();
  await saveFeelingsState(store, state);
}

async function handleParentPinChange(parentPin: string): Promise<void> {
  if (!isValidParentPin(parentPin.trim())) {
    parentModeMessage = messages.invalidPinMessage;
    render();
    return;
  }

  parentModeMessage = "";
  state = setParentPin(state, parentPin);
  render();
  await saveFeelingsState(store, state);
}

async function init(): Promise<void> {
  document.title = messages.appTitle;
  if (appTitle) appTitle.textContent = messages.appTitle;
  state = await loadFeelingsState(store, defaultCareCardsByLevel);
  render();
}

void init();

function formatHistoryTime(selectedAt: string): string {
  return new Intl.DateTimeFormat(chrome.i18n.getUILanguage(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(selectedAt));
}
