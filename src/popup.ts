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
  getBoundaryFeelingLevelId,
  getNextFeelingLevelId,
  isValidParentPin,
  markPremiumPurchased,
  removeCareCard,
  recordFeelingSelection,
  setParentPin,
  setFeelingHistoryRetention,
  startPremiumTrial,
  updateCareCard,
} from "./core/feelings";
import type { CareCardPresetMap } from "./core/careCards";
import { loadFeelingsState, saveFeelingsState } from "./core/feelingsPersistence";
import { store } from "./storage";

const app = document.querySelector<HTMLDivElement>("#app");
const appTitle = document.querySelector<HTMLElement>("[data-i18n='appTitle']");

interface PopupMessages {
  appTitle: string;
  levelSelectAria: (levelNumber: number, levelLabel: string) => string;
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
  premiumAria: string;
  premiumTitle: string;
  premiumActive: string;
  premiumTrialActive: (days: number) => string;
  premiumFree: string;
  premiumExpired: string;
  premiumStartTrial: string;
  premiumCheckout: string;
  premiumPurchased: string;
  premiumRequired: string;
  premiumHistoryRequired: string;
}

const messages = createPopupMessages();
const levelLabels = createLevelLabels();
const defaultCareCardsByLevel = createLocalizedDefaultCareCardsByLevel();

let state: FeelingsState = createInitialFeelingsState(defaultCareCardsByLevel);
let parentModeMessage = "";
let levelToFocusAfterRender: FeelingLevelId | null = null;

function createPopupMessages(): PopupMessages {
  return {
    appTitle: t("appTitle"),
    levelSelectAria: (levelNumber, levelLabel) => t("levelSelectAria", [String(levelNumber), levelLabel]),
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
    premiumAria: t("premiumAria"),
    premiumTitle: t("premiumTitle"),
    premiumActive: t("premiumActive"),
    premiumTrialActive: (days) => t("premiumTrialActive", String(days)),
    premiumFree: t("premiumFree"),
    premiumExpired: t("premiumExpired"),
    premiumStartTrial: t("premiumStartTrial"),
    premiumCheckout: t("premiumCheckout"),
    premiumPurchased: t("premiumPurchased"),
    premiumRequired: t("premiumRequired"),
    premiumHistoryRequired: t("premiumHistoryRequired"),
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
  button.dataset.levelId = String(level.id);
  button.dataset.selected = String(isSelected);
  button.tabIndex = isSelected ? 0 : -1;
  button.setAttribute("role", "radio");
  button.setAttribute("aria-checked", String(isSelected));
  button.setAttribute("aria-label", messages.levelSelectAria(level.id, level.label));
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
  button.addEventListener("keydown", (event) => {
    void handleLevelKeydown(event, level.id);
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

  const viewModel = createFeelingsViewModel(state, levelLabels, new Date().toISOString());
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
    canUseHistory,
    premium,
  } = viewModel;
  app.replaceChildren();

  const style = document.createElement("style");
  style.textContent = `
    .popup-shell {
      display: grid;
      gap: 14px;
    }
    .popup-shell :focus-visible {
      outline: 3px solid #1d4ed8;
      outline-offset: 2px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .mode-panel {
      display: grid;
      gap: 10px;
      border: 2px solid #f1dfbe;
      border-radius: 18px;
      background: #fffdf7;
      padding: 12px;
      box-shadow: 0 8px 18px rgba(82, 62, 36, 0.08);
    }
    .mode-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .mode-label {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
      color: #332f2a;
    }
    .mode-form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
    }
    .pin-input {
      min-width: 0;
      box-sizing: border-box;
      border: 2px solid #e5d7bf;
      border-radius: 12px;
      padding: 11px 12px;
      font: inherit;
      font-size: 15px;
      line-height: 1.35;
      background: #fffefa;
    }
    .mode-button {
      min-height: 44px;
      border: 2px solid #d7c6a8;
      border-radius: 14px;
      background: #ffffff;
      padding: 10px 12px;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      color: #2f2b25;
      cursor: pointer;
    }
    .mode-button:disabled {
      color: #5f5f5f;
      background: #f1f1f1;
      cursor: default;
    }
    .mode-message {
      margin: 0;
      color: #9a3412;
      font-size: 12px;
      line-height: 1.35;
    }
    .premium-panel {
      display: grid;
      gap: 10px;
      border: 2px solid #dce8f7;
      border-radius: 18px;
      background: #f8fcff;
      padding: 12px;
      box-shadow: 0 8px 18px rgba(42, 78, 112, 0.07);
    }
    .premium-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
      color: #24394a;
    }
    .premium-status,
    .premium-note {
      margin: 0;
      color: #444;
      font-size: 12px;
      line-height: 1.35;
    }
    .premium-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .premium-button,
    .premium-link {
      box-sizing: border-box;
      min-height: 44px;
      border: 2px solid #c6d7e6;
      border-radius: 14px;
      background: white;
      color: #222;
      padding: 10px 12px;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
    }
    .premium-button:disabled {
      cursor: default;
      color: #5f5f5f;
      background: #f1f1f1;
    }
    .level-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .level-button {
      appearance: none;
      position: relative;
      min-width: 0;
      border: 3px solid rgba(255, 255, 255, 0.92);
      border-radius: 18px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.34)),
        color-mix(in srgb, var(--level-color) 24%, white);
      padding: 0 5px 10px;
      display: grid;
      grid-template-rows: 9px auto auto 1fr;
      gap: 5px;
      justify-items: center;
      cursor: pointer;
      font: inherit;
      min-height: 116px;
      box-shadow: 0 7px 14px color-mix(in srgb, var(--level-color) 18%, transparent);
    }
    .level-button[data-selected="true"] {
      border-color: var(--level-color);
      box-shadow:
        0 0 0 3px #1f2937,
        0 8px 16px color-mix(in srgb, var(--level-color) 22%, transparent);
      transform: translateY(-1px);
    }
    .level-button[data-selected="true"]::after {
      content: "✓";
      position: absolute;
      top: 13px;
      right: 7px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: #1f2937;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      line-height: 1;
    }
    .level-button:focus-visible {
      outline: 3px solid #1d4ed8;
      outline-offset: 2px;
    }
    .level-color {
      width: calc(100% + 8px);
      height: 9px;
      border-radius: 16px 16px 0 0;
      background: var(--level-color);
    }
    .level-face {
      font-size: 32px;
      line-height: 1;
      filter: drop-shadow(0 2px 0 rgba(255, 255, 255, 0.72));
    }
    .level-number {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: white;
      color: #222;
      font-size: 13px;
      font-weight: 700;
      line-height: 1;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }
    .level-label {
      font-size: 12px;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
      overflow-wrap: anywhere;
      color: #2f2b25;
    }
    .selected-heading {
      margin: 0 0 8px;
      font-size: 18px;
      line-height: 1.25;
      color: #2f2b25;
    }
    .care-card-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .care-card-readonly {
      border: 2px solid color-mix(in srgb, ${selectedLevel.color} 28%, white);
      border-left: 9px solid ${selectedLevel.color};
      border-radius: 16px;
      background: #fffefa;
      padding: 13px 14px;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.4;
      box-shadow: 0 6px 14px rgba(66, 52, 33, 0.07);
    }
    .card-editor { display: grid; gap: 8px; }
    .care-card {
      border: 2px solid color-mix(in srgb, ${selectedLevel.color} 28%, white);
      border-left: 9px solid ${selectedLevel.color};
      border-radius: 16px;
      background: #fffefa;
      padding: 10px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .card-input {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      border: 2px solid #e4d8c5;
      border-radius: 12px;
      padding: 11px 12px;
      font-size: 15px;
      line-height: 1.35;
      font-family: inherit;
      background: #ffffff;
    }
    .card-delete,
    .card-add {
      min-height: 44px;
      border: 2px solid #d7c6a8;
      border-radius: 14px;
      background: white;
      padding: 10px 12px;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
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
      border: 2px solid #e7e0d3;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.72);
      padding: 12px;
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
      font-size: 14px;
      font-weight: 700;
      line-height: 1.35;
    }
    .history-toggle input { flex: 0 0 auto; }
    .history-clear {
      min-height: 40px;
      border: 2px solid #d7c6a8;
      border-radius: 13px;
      background: white;
      padding: 9px 11px;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .history-clear:disabled {
      color: #5f5f5f;
      background: #f1f1f1;
      cursor: default;
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
      border-radius: 12px;
      background: #fffefa;
      padding: 8px 9px;
      font-size: 13px;
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
  const premiumPanel = renderPremiumPanel(premium);

  const levelGrid = document.createElement("section");
  levelGrid.className = "level-grid";
  levelGrid.setAttribute("role", "radiogroup");
  levelGrid.setAttribute("aria-label", messages.currentFeelingAria);
  levelGrid.append(...levels.map((level) => renderLevelButton(level, selectedLevel)));

  const selectedHeading = document.createElement("h4");
  selectedHeading.className = "selected-heading";
  selectedHeading.textContent = messages.selectedHeading(selectedLevel.face, selectedLevel.label);

  const cardsSection = document.createElement("section");
  cardsSection.setAttribute("aria-label", messages.careCardsAria);
  cardsSection.setAttribute("aria-live", "polite");
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
  historyCheckbox.disabled = mode !== "parent" || !canUseHistory;
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
  clearHistoryButton.disabled = mode !== "parent" || !canUseHistory || !hasHistory;
  clearHistoryButton.addEventListener("click", () => {
    void handleHistoryClear();
  });

  historyControls.append(historyLabel, clearHistoryButton);
  historySection.append(historyControls);

  if (!canUseHistory) {
    const premiumRequired = document.createElement("p");
    premiumRequired.className = "history-empty";
    premiumRequired.textContent = messages.premiumHistoryRequired;
    historySection.append(premiumRequired);
  } else if (hasHistory) {
    const historyList = document.createElement("ul");
    historyList.className = "history-list";

    const recentHistory = feelingHistory.slice(-10).reverse();
    for (const historyItem of recentHistory) {
      const item = document.createElement("li");
      item.className = "history-item";
      item.style.setProperty("--history-color", historyItem.level.color);

      const face = document.createElement("span");
      face.setAttribute("aria-hidden", "true");
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

  shell.append(modePanel, premiumPanel, levelGrid, cardsSection, historySection);
  app.append(style, shell);
  focusPendingLevelButton();
}

function renderPremiumPanel(premium: ReturnType<typeof createFeelingsViewModel>["premium"]): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "premium-panel";
  panel.setAttribute("aria-label", messages.premiumAria);

  const title = document.createElement("p");
  title.className = "premium-title";
  title.textContent = messages.premiumTitle;

  const status = document.createElement("p");
  status.className = "premium-status";
  status.textContent = getPremiumStatusMessage(premium);

  const note = document.createElement("p");
  note.className = "premium-note";
  note.textContent = messages.premiumRequired;

  const actions = document.createElement("div");
  actions.className = "premium-actions";

  const trialButton = document.createElement("button");
  trialButton.type = "button";
  trialButton.className = "premium-button";
  trialButton.textContent = messages.premiumStartTrial;
  trialButton.disabled = !premium.isTrialAvailable;
  trialButton.addEventListener("click", () => {
    void handlePremiumTrialStart();
  });

  const checkoutLink = document.createElement("a");
  checkoutLink.className = "premium-link";
  checkoutLink.href = premium.checkoutUrl;
  checkoutLink.target = "_blank";
  checkoutLink.rel = "noreferrer";
  checkoutLink.textContent = messages.premiumCheckout;

  const purchasedButton = document.createElement("button");
  purchasedButton.type = "button";
  purchasedButton.className = "premium-button";
  purchasedButton.textContent = messages.premiumPurchased;
  purchasedButton.disabled = premium.status === "premium";
  purchasedButton.addEventListener("click", () => {
    void handlePremiumPurchased();
  });

  actions.append(trialButton, checkoutLink, purchasedButton);
  panel.append(title, status, note, actions);
  return panel;
}

async function handleLevelKeydown(
  event: KeyboardEvent,
  currentLevelId: FeelingLevelId,
): Promise<void> {
  const nextLevelId = getKeyboardTargetLevelId(event.key, currentLevelId);
  if (!nextLevelId) return;

  event.preventDefault();
  if (nextLevelId === currentLevelId) return;

  levelToFocusAfterRender = nextLevelId;
  await handleLevelSelect(nextLevelId);
}

function getKeyboardTargetLevelId(
  key: string,
  currentLevelId: FeelingLevelId,
): FeelingLevelId | null {
  if (key === "ArrowRight" || key === "ArrowDown") {
    return getNextFeelingLevelId(currentLevelId, 1);
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return getNextFeelingLevelId(currentLevelId, -1);
  }

  if (key === "Home") return getBoundaryFeelingLevelId("first");
  if (key === "End") return getBoundaryFeelingLevelId("last");
  return null;
}

function focusPendingLevelButton(): void {
  if (!levelToFocusAfterRender || !app) return;

  const levelButton = app.querySelector<HTMLButtonElement>(
    `.level-button[data-level-id="${levelToFocusAfterRender}"]`,
  );
  levelToFocusAfterRender = null;
  levelButton?.focus();
}

function getPremiumStatusMessage(
  premium: ReturnType<typeof createFeelingsViewModel>["premium"],
): string {
  if (premium.status === "premium") return messages.premiumActive;
  if (premium.isTrialActive) return messages.premiumTrialActive(premium.trialDaysRemaining);
  if (premium.status === "trial") return messages.premiumExpired;
  return messages.premiumFree;
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
    message.setAttribute("role", "alert");
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
  state = setFeelingHistoryRetention(state, shouldKeepHistory, new Date().toISOString());
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

async function handlePremiumTrialStart(): Promise<void> {
  parentModeMessage = "";
  state = startPremiumTrial(state, new Date().toISOString());
  render();
  await saveFeelingsState(store, state);
}

async function handlePremiumPurchased(): Promise<void> {
  parentModeMessage = "";
  state = markPremiumPurchased(state, new Date().toISOString());
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
