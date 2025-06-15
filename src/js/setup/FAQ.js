import { dynamicStar } from '../components/ui/DynamicStarEffect';

const SECTION_ID = 'faq';

const CONFIG_STAR_DYNAMICS = {
    size: '3rem',
    visibleDuration: { min: 15000, max: 20000 },
    hiddenDuration: { min: 0, max: 0 },
    position: {
        mode: 'element',
        anchorElement: document.getElementById('faqContainer'),
        align: 'bottom left',
        offset: { x: 100, y: -100 },
    },
};

class FAQSetup{
    constructor() {

    }

    init() {
        this.dynamicStarEffect = dynamicStar(SECTION_ID, CONFIG_STAR_DYNAMICS);
    }

    cleanup() {
        if (this.dynamicStarEffect) {
            this.dynamicStarEffect.destroy();
            this.dynamicStarEffect = null;
        }
    }
}

export default function initFAQSetup() {
    const faqSetup = new FAQSetup();
    faqSetup.init();
    return faqSetup;
}
