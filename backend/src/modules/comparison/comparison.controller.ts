import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { RunComparisonDto } from './dto/run-comparison.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('comparison')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('run')
  run(@Body() dto: RunComparisonDto) {
    return this.comparisonService.compare(dto);
  }
}
