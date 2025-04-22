export type CallResultDto<T> = {
	isSuccess: boolean;
	message: string;
	data: T;
	data2: number;
	totalCount: number | null;
};

export type CallResultFileDto<T> = {
	data: T;
	headers: Record<string, string>;
};