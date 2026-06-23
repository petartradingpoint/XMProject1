import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Book } from '../books/book.entity';

@Entity()
export class Author {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  nationality!: string | null;

  @Column({ type: 'integer', nullable: true })
  birthYear!: number | null;

  @ManyToMany(() => Book, (book) => book.authors)
  books!: Book[];
}
