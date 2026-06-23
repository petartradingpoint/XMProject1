import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BookResponse } from '../books/dto/book-response.dto';
import { AuthorsService } from './authors.service';
import { AuthorRequestDto } from './dto/author-request.dto';
import { AuthorResponse } from './dto/author-response.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  findAll(): Promise<AuthorResponse[]> {
    return this.authorsService.findAll();
  }

  @Post()
  create(@Body() dto: AuthorRequestDto): Promise<AuthorResponse> {
    return this.authorsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuthorResponse> {
    return this.authorsService.findOne(id);
  }

  @Get(':id/books')
  findBooks(@Param('id', ParseIntPipe) id: number): Promise<BookResponse[]> {
    return this.authorsService.findBooks(id);
  }
}
