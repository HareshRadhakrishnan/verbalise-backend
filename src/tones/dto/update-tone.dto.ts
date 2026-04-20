import { PartialType } from '@nestjs/swagger';
import { CreateToneDto } from './create-tone.dto';

export class UpdateToneDto extends PartialType(CreateToneDto) {}
