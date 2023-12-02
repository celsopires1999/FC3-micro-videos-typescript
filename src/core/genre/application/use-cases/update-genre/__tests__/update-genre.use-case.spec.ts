import { GenreInMemoryRepository } from "@core/genre/infra/db/in-memory/genre-in-memory.repository";
import { UpdateGenreUseCase } from "../update-genre.use-case";
import { CategoryInMemoryRepository } from "@core/category/infra/db/in-memory/category-in-memory.repository";
import { CategoriesIdExistsInDatabaseValidator } from "@core/category/application/validations/categories-ids-exists-in-database.validator";
import { UnitOfWorkFakeInMemory } from "@core/shared/infra/db/in-memory/fake-unit-of-work-in-memory";
import { Genre } from "@core/genre/domain/genre.aggregate";
import { UpdateGenreInput } from "../update-genre.input";
import { EntityValidationError } from "@core/shared/domain/validators/validation.error";
import { Category } from "@core/category/domain/category.aggregate";

describe("UpdateGenreUseCase Unit Tests", () => {
  let useCase: UpdateGenreUseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let categoriesIdExistsInStorageValidator: CategoriesIdExistsInDatabaseValidator;
  let uow: UnitOfWorkFakeInMemory;

  beforeEach(() => {
    uow = new UnitOfWorkFakeInMemory();
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    categoriesIdExistsInStorageValidator =
      new CategoriesIdExistsInDatabaseValidator(categoryRepo);
    useCase = new UpdateGenreUseCase(
      uow,
      genreRepo,
      categoryRepo,
      categoriesIdExistsInStorageValidator,
    );
  });

  describe("execute method", () => {
    it("should throw an entity validation error when categories ids do not exist", async () => {
      expect.assertions(3);
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const spyValidateCategoriesId = jest.spyOn(
        categoriesIdExistsInStorageValidator,
        "validate",
      );
      try {
        await useCase.execute(
          new UpdateGenreInput({
            id: genre.genre_id.id,
            name: "test",
            categories_id: [
              "0828ac21-05d3-481a-aaf4-63c5f9a55b04",
              "c145b6af-16f9-43f6-9fdb-658615bbd7af",
            ],
          }),
        );
      } catch (e) {
        expect(spyValidateCategoriesId).toHaveBeenCalledWith([
          "0828ac21-05d3-481a-aaf4-63c5f9a55b04",
          "c145b6af-16f9-43f6-9fdb-658615bbd7af",
        ]);
        expect(e).toBeInstanceOf(EntityValidationError);
        expect(e.error).toStrictEqual([
          {
            categories_id: [
              "Category Not Found using ID 0828ac21-05d3-481a-aaf4-63c5f9a55b04",
              "Category Not Found using ID c145b6af-16f9-43f6-9fdb-658615bbd7af",
            ],
          },
        ]);
      }
    });

    it("should update a genre", async () => {
      const category1 = Category.fake().aCategory().build();
      const category2 = Category.fake().aCategory().build();
      await categoryRepo.bulkInsert([category1, category2]);
      const genre = Genre.fake()
        .aGenre()
        .addCategoryId(category1.category_id)
        .addCategoryId(category2.category_id)
        .build();
      await genreRepo.insert(genre);
      const spyUpdate = jest.spyOn(genreRepo, "update");
      const spyUowDo = jest.spyOn(uow, "do");
      let output = await useCase.execute(
        new UpdateGenreInput({
          id: genre.genre_id.id,
          name: "test",
          categories_id: [category1.category_id.id],
        }),
      );
      expect(spyUowDo).toHaveBeenCalledTimes(1);
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genre.genre_id.id,
        name: "test",
        categories: [category1].map((e) => ({
          id: e.category_id.id,
          name: e.name,
          created_at: e.created_at,
        })),
        categories_id: [category1.category_id.id],
        is_active: true,
        created_at: genreRepo.items[0].created_at,
      });

      output = await useCase.execute(
        new UpdateGenreInput({
          id: genre.genre_id.id,
          name: "test",
          categories_id: [category1.category_id.id, category2.category_id.id],
          is_active: false,
        }),
      );
      expect(spyUpdate).toHaveBeenCalledTimes(2);
      expect(spyUowDo).toHaveBeenCalledTimes(2);
      expect(output).toStrictEqual({
        id: genreRepo.items[0].genre_id.id,
        name: "test",
        categories_id: [category1.category_id.id, category2.category_id.id],
        categories: [category1, category2].map((e) => ({
          id: e.category_id.id,
          name: e.name,
          created_at: e.created_at,
        })),
        is_active: false,
        created_at: genreRepo.items[0].created_at,
      });
    });
  });
});
