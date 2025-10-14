import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class RunComparisonDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  documentIds: string[];

  @IsOptional()
  @IsBoolean()
  includeHistory?: boolean = true;
}
