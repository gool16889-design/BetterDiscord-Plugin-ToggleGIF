/**
 * @name ToggleGifs
 * @author Fursty
 * @description Размывает GIF-изображения помогает от 18+ гифок когда к тебе заходит мама она не увидит 18+ гифку и ты останешся с компом, ты можешь включить гифку и скрыть обратно её
 * @version 0.1
 */

module.exports = class ToggleGifs {
    constructor() {
        this.defaultSettings = { blurRadius: 30 };
        this.settings = { ...this.defaultSettings };
        this.hoveredWrapper = null;
    }

    start() {
        this.settings = BdApi.Data.load("ToggleGifs", "settings") || { ...this.defaultSettings };
        this.updateStyles();

        this.observer = new MutationObserver(() => this.processGifs());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.processGifs();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener("keydown", this.handleKeyDown, true);
    }

    stop() {
        if (this.observer) this.observer.disconnect();
        window.removeEventListener("keydown", this.handleKeyDown, true);
        BdApi.DOM.removeStyle("ToggleGifsStyles");
        
        document.querySelectorAll(".tg-overlay, .tg-top-hide-container").forEach(el => el.remove());
        document.querySelectorAll(".tg-blur").forEach(el => el.classList.remove("tg-blur"));
        document.querySelectorAll(".tg-wrapper").forEach(el => {
            const original = el.firstElementChild;
            if (original) el.replaceWith(original);
        });
        document.querySelectorAll("[data-tg-processed]").forEach(el => {
            el.removeAttribute("data-tg-processed");
        });
    }

    handleKeyDown(e) {
        // Блокируем бинды, если пользователь пишет в чате
        const isEditing = 
            e.target.tagName === "INPUT" || 
            e.target.tagName === "TEXTAREA" || 
            e.target.isContentEditable || 
            e.target.closest('[class^="textArea_"]') || 
            e.target.closest('[role="textbox"]');

        if (isEditing) return;

        // Если мышка не наведена на GIF — ничего не делаем
        if (!this.hoveredWrapper) return;

        const targetElement = this.hoveredWrapper.querySelector(".tg-blur, [data-tg-processed]");
        const overlay = this.hoveredWrapper.querySelector(".tg-overlay");

        if (!targetElement || !overlay) return;

        // Проверяем зажатый Shift + клавишу E
        if (e.shiftKey && e.code === "KeyE") {
            e.preventDefault();
            targetElement.classList.remove("tg-blur");
            overlay.style.display = "none";
        } 
        // Проверяем зажатый Shift + клавишу F
        else if (e.shiftKey && e.code === "KeyF") {
            e.preventDefault();
            targetElement.classList.add("tg-blur");
            overlay.style.display = "flex";
        }
    }

    updateStyles() {
        BdApi.DOM.addStyle("ToggleGifsStyles", `
            .tg-wrapper {
                position: relative;
                display: inline-block;
                max-width: 100%;
                overflow: hidden;
                border-radius: 8px;
            }
            .tg-blur {
                filter: blur(${this.settings.blurRadius}px) brightness(0.6) !important;
                pointer-events: none !important;
                transform: scale(1.05);
                transition: filter 0.2s ease, transform 0.2s ease;
            }
            .tg-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.2);
                z-index: 999;
                cursor: pointer;
            }
            .tg-btn {
                background: rgba(0, 0, 0, 0.75);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 13px;
                font-family: var(--font-primary, sans-serif);
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 6px;
                user-select: none;
                transition: background 0.2s, transform 0.1s;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            .tg-btn:hover {
                background: var(--brand-experiment, #5865f2);
                transform: scale(1.03);
            }
            .tg-btn svg, .tg-btn span {
                pointer-events: none;
            }
            .tg-top-hide-container {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 40px;
                background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding: 0 8px;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            }
            .tg-wrapper:hover .tg-top-hide-container {
                opacity: 1;
            }
            .tg-top-btn {
                pointer-events: auto;
                background: rgba(0, 0, 0, 0.7);
                color: #fff;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-family: var(--font-primary, sans-serif);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .tg-top-btn:hover {
                background: rgba(255, 0, 0, 0.7);
            }
        `);
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "10px";
        panel.style.color = "var(--text-normal)";
        panel.style.fontFamily = "var(--font-primary)";

        const title = document.createElement("h3");
        title.innerText = "Радиус размытия (px)";
        title.style.marginBottom = "8px";
        title.style.fontSize = "14px";
        title.style.fontWeight = "600";

        const sliderContainer = document.createElement("div");
        sliderContainer.style.display = "flex";
        sliderContainer.style.alignItems = "center";
        sliderContainer.style.gap = "12px";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "5";
        slider.max = "100";
        slider.value = this.settings.blurRadius;
        slider.style.flex = "1";
        slider.style.cursor = "pointer";

        const valueLabel = document.createElement("span");
        valueLabel.innerText = `${this.settings.blurRadius}px`;
        valueLabel.style.fontSize = "14px";
        valueLabel.style.minWidth = "40px";

        slider.addEventListener("input", (e) => {
            const val = parseInt(e.target.value);
            valueLabel.innerText = `${val}px`;
            this.settings.blurRadius = val;
            BdApi.Data.save("ToggleGifs", "settings", this.settings);
            this.updateStyles();
        });

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueLabel);
        panel.appendChild(title);
        panel.appendChild(sliderContainer);

        return panel;
    }

    getEyeIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> `;
    }

    getEyeOffIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    }

    processGifs() {
        const selectors = [
            'img[src*=".gif"]', 
            'img[src*="tenor.com"]', 
            'img[src*="giphy.com"]', 
            'video[src*=".mp4"]', 
            '[class^="embedVideo_"]'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(gif => {
            if (gif.closest('[class^="avatar_"]') || gif.closest('[class^="emoji_"]') || gif.closest('.tg-wrapper') || gif.dataset.tgProcessed) return;
            gif.dataset.tgProcessed = "true";

            let targetElement = gif;
            const attachment = gif.closest('[class^="attachment_"]') || gif.closest('[class^="embed_"]') || gif.closest('a');
            if (attachment && !attachment.classList.contains('tg-wrapper')) {
                targetElement = attachment;
            }

            const wrapper = document.createElement("div");
            wrapper.className = "tg-wrapper";
            targetElement.parentNode.insertBefore(wrapper, targetElement);
            wrapper.appendChild(targetElement);

            targetElement.classList.add("tg-blur");

            const overlay = document.createElement("div");
            overlay.className = "tg-overlay";

            const btn = document.createElement("button");
            btn.className = "tg-btn";
            btn.innerHTML = `${this.getEyeIcon()} <span>Показать GIF</span>`;
            overlay.appendChild(btn);

            const topHideContainer = document.createElement("div");
            topHideContainer.className = "tg-top-hide-container";

            const topBtn = document.createElement("button");
            topBtn.className = "tg-top-btn";
            topBtn.innerHTML = `${this.getEyeOffIcon()} Скрыть`;
            topHideContainer.appendChild(topBtn);

            wrapper.appendChild(overlay);
            wrapper.appendChild(topHideContainer);

            wrapper.addEventListener("mouseenter", () => {
                this.hoveredWrapper = wrapper;
            });
            wrapper.addEventListener("mouseleave", () => {
                if (this.hoveredWrapper === wrapper) this.hoveredWrapper = null;
            });

            const blockEvent = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            };

            const showGif = (e) => {
                blockEvent(e);
                targetElement.classList.remove("tg-blur");
                overlay.style.display = "none";
            };

            const blockHide = (e) => {
                blockEvent(e);
                targetElement.classList.add("tg-blur");
                overlay.style.display = "flex";
            };

            overlay.addEventListener("mousedown", showGif, true);
            overlay.addEventListener("click", blockEvent, true);

            topBtn.addEventListener("mousedown", blockHide, true);
            topBtn.addEventListener("click", blockEvent, true);
        });
    }
};