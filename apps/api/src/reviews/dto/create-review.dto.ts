import { IsInt, IsString, Max, Min, MaxLength } from "class-validator";

export class CreateReviewDTO {
    @IsString()
    @MaxLength(1000)
    reviewText: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number
}