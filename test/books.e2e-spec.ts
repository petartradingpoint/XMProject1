import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-app';

describe('Books (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  let isbnCounter = 0;
  const uniqueIsbn = () => `isbn-${Date.now()}-${isbnCounter++}`;

  const validBook = (overrides: Record<string, unknown> = {}) => ({
    title: 'The Hobbit',
    authors: ['J.R.R. Tolkien'],
    isbn: uniqueIsbn(),
    publishedYear: 1937,
    genre: 'Fantasy',
    rating: null,
    ...overrides,
  });

  describe('POST /api/books', () => {
    it('creates a book (201) and serializes authors as a name array', async () => {
      const payload = validBook();
      const res = await request(server())
        .post('/api/books')
        .send(payload)
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(Number),
        title: payload.title,
        authors: ['J.R.R. Tolkien'],
        isbn: payload.isbn,
        publishedYear: 1937,
        genre: 'Fantasy',
        rating: null,
      });
    });

    it('creates a book with a rating (201)', async () => {
      const res = await request(server())
        .post('/api/books')
        .send(validBook({ rating: 4 }))
        .expect(201);

      expect(res.body.rating).toBe(4);
    });

    it('creates a book with multiple authors (201)', async () => {
      const res = await request(server())
        .post('/api/books')
        .send(
          validBook({
            title: 'Good Omens',
            authors: ['Terry Pratchett', 'Neil Gaiman'],
          }),
        )
        .expect(201);

      expect(res.body.authors).toEqual(['Terry Pratchett', 'Neil Gaiman']);
    });

    it('de-duplicates repeated author names (201)', async () => {
      const res = await request(server())
        .post('/api/books')
        .send(validBook({ authors: ['Repeated Name', 'Repeated Name'] }))
        .expect(201);

      expect(res.body.authors).toEqual(['Repeated Name']);
    });

    it('rejects invalid input (400) with the ErrorResponse shape', async () => {
      const res = await request(server())
        .post('/api/books')
        .send({ title: '', authors: [], isbn: '', publishedYear: 'soon' })
        .expect(400);

      expect(res.body).toEqual({
        error: expect.any(String),
        message: expect.any(String),
        status: 400,
      });
    });

    it('rejects an empty authors array (400)', async () => {
      await request(server())
        .post('/api/books')
        .send(validBook({ authors: [] }))
        .expect(400);
    });

    it('rejects a non-string author entry (400)', async () => {
      await request(server())
        .post('/api/books')
        .send(validBook({ authors: [123] }))
        .expect(400);
    });

    it('rejects a rating outside the 1 to 5 range (400)', async () => {
      await request(server())
        .post('/api/books')
        .send(validBook({ rating: 6 }))
        .expect(400);
    });

    it('rejects the legacy single "author" field (400)', async () => {
      const { authors: _authors, ...rest } = validBook();
      void _authors;
      await request(server())
        .post('/api/books')
        .send({ ...rest, author: 'J.R.R. Tolkien' })
        .expect(400);
    });

    it('rejects a duplicate ISBN (409)', async () => {
      const isbn = uniqueIsbn();
      await request(server())
        .post('/api/books')
        .send(validBook({ isbn }))
        .expect(201);

      const res = await request(server())
        .post('/api/books')
        .send(validBook({ isbn, title: 'Another' }))
        .expect(409);

      expect(res.body).toEqual({
        error: expect.any(String),
        message: expect.any(String),
        status: 409,
      });
    });
  });

  describe('GET /api/books', () => {
    it('returns all books (200)', async () => {
      await request(server()).post('/api/books').send(validBook()).expect(201);

      const res = await request(server()).get('/api/books').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('filters by genre', async () => {
      const genre = `Genre-${Date.now()}`;
      await request(server())
        .post('/api/books')
        .send(validBook({ genre }))
        .expect(201);

      const res = await request(server())
        .get('/api/books')
        .query({ genre })
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].genre).toBe(genre);
    });

    it('filters by author name and returns the full author list', async () => {
      const author = `Author-${Date.now()}`;
      const coAuthor = `Co-${Date.now()}`;
      await request(server())
        .post('/api/books')
        .send(validBook({ authors: [author, coAuthor] }))
        .expect(201);

      const res = await request(server())
        .get('/api/books')
        .query({ author })
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].authors).toEqual([author, coAuthor]);
    });
  });

  describe('GET /api/books/:id', () => {
    it('returns a book by id (200)', async () => {
      const created = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);

      const res = await request(server())
        .get(`/api/books/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.rating).toBeNull();
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(server()).get('/api/books/999999').expect(404);

      expect(res.body).toEqual({
        error: expect.any(String),
        message: expect.any(String),
        status: 404,
      });
    });
  });

  describe('PUT /api/books/:id', () => {
    it('updates an existing book (200)', async () => {
      const created = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);

      const res = await request(server())
        .put(`/api/books/${created.body.id}`)
        .send(
          validBook({
            isbn: created.body.isbn,
            title: 'The Hobbit (Revised)',
            publishedYear: 1951,
          }),
        )
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          id: created.body.id,
          title: 'The Hobbit (Revised)',
          publishedYear: 1951,
          rating: null,
        }),
      );
    });

    it('updates and persists a book rating (200)', async () => {
      const created = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);

      await request(server())
        .put(`/api/books/${created.body.id}`)
        .send(
          validBook({
            isbn: created.body.isbn,
            title: created.body.title,
            authors: ['J.R.R. Tolkien'],
            rating: 5,
          }),
        )
        .expect(200);

      const reloaded = await request(server())
        .get(`/api/books/${created.body.id}`)
        .expect(200);

      expect(reloaded.body.rating).toBe(5);
    });

    it('replaces the authors on update (200)', async () => {
      const created = await request(server())
        .post('/api/books')
        .send(validBook({ authors: ['First Author', 'Second Author'] }))
        .expect(201);

      const res = await request(server())
        .put(`/api/books/${created.body.id}`)
        .send(validBook({ isbn: created.body.isbn, authors: ['Only Author'] }))
        .expect(200);

      expect(res.body.authors).toEqual(['Only Author']);
    });

    it('returns 400 on invalid payload', async () => {
      const created = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);

      await request(server())
        .put(`/api/books/${created.body.id}`)
        .send({ title: 'No required fields' })
        .expect(400);
    });

    it('returns 404 when updating an unknown book', async () => {
      await request(server())
        .put('/api/books/999999')
        .send(validBook())
        .expect(404);
    });

    it('returns 409 when the new ISBN collides with another book', async () => {
      const first = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);
      const second = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);

      const res = await request(server())
        .put(`/api/books/${second.body.id}`)
        .send(validBook({ isbn: first.body.isbn }))
        .expect(409);

      expect(res.body.status).toBe(409);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('deletes a book (204)', async () => {
      const created = await request(server())
        .post('/api/books')
        .send(validBook())
        .expect(201);

      await request(server())
        .delete(`/api/books/${created.body.id}`)
        .expect(204);

      await request(server()).get(`/api/books/${created.body.id}`).expect(404);
    });

    it('returns 404 when deleting an unknown book', async () => {
      await request(server()).delete('/api/books/999999').expect(404);
    });
  });
});
