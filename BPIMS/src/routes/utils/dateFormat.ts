import RNFS from 'react-native-fs';

export function formatTransactionDate(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    return `${formattedDate} ${formattedTime}`;
}

export function formatTransactionDateOnly(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return formattedDate;
}

export function formatTransactionTime(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    return formattedTime;
}

export function capitalizeFirstLetter(name: string): string {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function formatPrice(value: number | string): string {
    if (typeof value === "string") {
        value = parseFloat(value);
    }

    if (isNaN(value)) {
        return "0";
    }

    return value.toFixed(2);
}

export const normalizeUri = async (uri: string) => {
    if (uri.startsWith('file://')) {
        return uri;
    }
    const filePath = `${RNFS.TemporaryDirectoryPath}/${new Date().getTime()}.jpg`;
    await RNFS.copyFile(uri, filePath);
    return `file://${filePath}`;
};


export const formatCurrency = (value: number) =>
    `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


export function formatShortDateTimePH(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    return `${formattedDate} ${formattedTime}`;
}

export const truncateName = (name: string) => {
    const maxLength = 25;
    return name && name.length > maxLength ? name.slice(0, maxLength) + "..." : name;
};

export const truncateShortName = (name: string) => {
    const maxLength = 6;
    return name && name.length > maxLength ? name.slice(0, maxLength) + "..." : name;
};


export function formatQuantity(quantity: number, sellByUnit: boolean): string {
    const numericQuantity = Number(quantity);
    return sellByUnit ? Math.round(numericQuantity).toFixed(0) : numericQuantity.toFixed(2);
}


export function formatmmddyyyyDate(date: Date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
};
