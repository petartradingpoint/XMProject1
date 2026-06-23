import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Author } from '../authors/author.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ length: 255, unique: true })
  isbn!: string;

  @Column({ type: 'integer' })
  publishedYear!: number;

  @Column({ type: 'varchar', nullable: true })
  genre!: string | null;

  @Column({ type: 'integer', nullable: true })
  rating!: number | null;

  @ManyToMany(() => Author, (author) => author.books, { eager: true })
  @JoinTable()
  authors!: Author[];
}
