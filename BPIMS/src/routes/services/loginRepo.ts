import { CallResultDto } from "../types/CallResultDto";
import { UserDto } from "../types/userType";
import { postToBaseApi } from "../utils/apiService";
import { hashPassword } from "../utils/auth";


export async function loginUser(email: string, password: string) {
    const encryptedPassword = hashPassword(password);
    return await postToBaseApi<CallResultDto<UserDto>>('loginUser', { email, encryptedPassword });
}