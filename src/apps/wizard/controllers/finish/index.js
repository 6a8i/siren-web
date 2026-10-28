import loading from 'components/loading/loading';
import { initWizardPage } from '../wizardShell';
import { ServerConnections } from 'lib/jellyfin-apiclient';

function onFinish() {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.ajax({
        url: apiClient.getUrl('Startup/Complete'),
        type: 'POST'
    }).then(function () {
        loading.hide();
        window.location.href = '';
    });
}

export default function (view) {
    initWizardPage(view, 6);
    view.querySelector('.btnWizardNext').addEventListener('click', onFinish);
}
