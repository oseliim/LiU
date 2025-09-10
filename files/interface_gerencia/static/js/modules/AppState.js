export const AppState = {
    monitoringInterval: null,
    charts: {},
    activeView: 'server',
    activeClientIp: null
};

export function setActiveView(view) {
    AppState.activeView = view;
}

export function setActiveClientIp(ip) {
    AppState.activeClientIp = ip;
}

export function clearMonitoringInterval() {
    if (AppState.monitoringInterval) {
        clearInterval(AppState.monitoringInterval);
        AppState.monitoringInterval = null;
    }
}

export function setMonitoringInterval(id) {
    AppState.monitoringInterval = id;
}

