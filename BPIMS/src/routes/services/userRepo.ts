import { CallResultDto } from "../types/CallResultDto";
import { ObjectDto, UserListDto } from "../types/userType";
import { getFromBaseApi, postToBaseApi, putToBaseApi } from "../utils/apiService";

const requestTracker = new Map<string, boolean>();

function getRequestKey(url: string, data: any) {
    return `${url}:${JSON.stringify(data)}`;
}

export async function getUsers(search: string) {
    return await getFromBaseApi<CallResultDto<UserListDto[]>>('getUsers', { search });
}

export async function getUser(id: number) {
    return await getFromBaseApi<CallResultDto<UserListDto>>('getUser', { id });
}

export async function addUser(user: UserListDto) {
    const key = getRequestKey('addUser', user);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi<CallResultDto<number>>('addUser', { user });
    } finally {
        requestTracker.delete(key);
    }
}

export async function editUser(user: UserListDto) {
    const key = getRequestKey('editUser', user);
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi<CallResultDto<number>>('editUser', { user });
    } finally {
        requestTracker.delete(key);
    }
}

export async function getDepartments() {
    return await getFromBaseApi<ObjectDto[]>('getDepartments');
}

export async function getBranches() {
    return await getFromBaseApi<ObjectDto[]>('getBranches');
}

export async function setUserInactive(id: number) {
    const key = getRequestKey('setUserInactive', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await postToBaseApi('setUserInactive', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function setBranchInactive(id: number) {
    const key = getRequestKey('setBranchInactive', { id });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('setBranchInactive', { id });
    } finally {
        requestTracker.delete(key);
    }
}

export async function saveBranch(id: number, name: string) {
    const key = getRequestKey('saveBranch', { id, name });
    if (requestTracker.get(key)) return;
    requestTracker.set(key, true);

    try {
        return await putToBaseApi('saveBranch', { id, name });
    } finally {
        requestTracker.delete(key);
    }
}
