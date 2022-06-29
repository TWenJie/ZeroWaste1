export interface Smartbin {
    _id: string;
    location: {
        type: string;
        coordinates: number[],
    },
    properties: {
        name:string;
        mapUrl: string;
        descriptions: string;
        imageUrl:string;
    }
}