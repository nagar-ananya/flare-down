import { RECIPES } from '../../constants/reset';
import { hasRecipeArt } from '../recipe-art';

it('has a picture for every recipe', () => {
  expect(RECIPES.filter((r) => !hasRecipeArt(r.id)).map((r) => r.id)).toEqual([]);
});
