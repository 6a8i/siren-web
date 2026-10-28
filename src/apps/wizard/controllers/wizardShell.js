import globalize from 'lib/globalize';

import './wizard.scss';

/** The setup steps, in order. The index of each one is what the pages pass to {@link initWizardPage}. */
const STEPS = [
    'WizardStepServer',
    'WizardStepUser',
    'WizardStepLibrary',
    'WizardStepMetadata',
    'WizardStepRemote',
    'WizardStepFinish'
];

function renderStep(key, index, currentStep) {
    const position = index + 1;
    let state = '';
    let marker = String(position);

    if (position < currentStep) {
        state = ' wizardStep-done';
        marker = '<span class="material-icons check" aria-hidden="true"></span>';
    } else if (position === currentStep) {
        state = ' wizardStep-current';
    }

    return `<li class="wizardStep${state}"${position === currentStep ? ' aria-current="step"' : ''}>`
        + `<span class="wizardStepIndex">${marker}</span>`
        + `<span class="wizardStepLabel">${globalize.translate(key)}</span>`
        + '</li>';
}

/**
 * Adds the brand panel and the step list to a wizard page, and hides the app header while the page is shown.
 * The pages keep their own forms untouched; this only wraps them in the Siren setup layout.
 * @param {HTMLElement} view The page element.
 * @param {number} currentStep The 1-based position of the page in the wizard.
 */
export function initWizardPage(view, currentStep) {
    const shell = view.querySelector('.wizardShell');

    if (shell && !shell.querySelector('.wizardBrand')) {
        const brand = document.createElement('aside');
        brand.className = 'wizardBrand';
        brand.innerHTML = '<div class="wizardBrandTop">'
            + '<div class="wizardBrandLogo" role="img" aria-label="Siren"></div>'
            + `<p class="wizardBrandTagline">${globalize.translate('WizardBrandTagline')}</p>`
            + '</div>'
            + `<ol class="wizardSteps">${STEPS.map((key, index) => renderStep(key, index, currentStep)).join('')}</ol>`
            + `<div class="wizardStepCounter">${globalize.translate('WizardStepOf', currentStep, STEPS.length)}</div>`;
        shell.insertBefore(brand, shell.firstChild);
    }

    if (view.dataset.wizardShell) {
        return;
    }

    view.dataset.wizardShell = 'true';

    // The page is being shown (or about to be); keep the body flag in step with it from here on.
    document.body.classList.add('wizardDocument');

    view.addEventListener('viewshow', () => {
        document.body.classList.add('wizardDocument');
    });

    view.addEventListener('viewhide', () => {
        document.body.classList.remove('wizardDocument');
    });

    view.addEventListener('viewdestroy', () => {
        document.body.classList.remove('wizardDocument');
    });
}
