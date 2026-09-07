import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Food } from '../models/Food.js';
import { User } from '../models/User.js';

export const officeFoods = [
  {
    name: 'Parotta',
    description: 'Freshly made layered, golden-crisp South Indian flaky parotta.',
    imageUrl: 'https://ik.imagekit.io/mdkaif472/pollhub/foods/parotta.jpg',
    imageFileId: '6a9aa47fead997d09a3fb743',
    category: 'Lunch',
    active: true
  },
  {
    name: 'Chapati',
    description: 'Soft homestyle whole wheat phulka chapatis served hot.',
    imageUrl: 'https://ik.imagekit.io/mdkaif472/pollhub/foods/chapati.jpg',
    imageFileId: '6a9aa480ead997d09a3fcac8',
    category: 'Lunch',
    active: true
  },
  {
    name: 'Curd Rice',
    description: 'Refreshing seasoned creamy curd rice garnished with mustard seeds, curry leaves & pomegranate.',
    imageUrl: 'https://ik.imagekit.io/mdkaif472/pollhub/foods/curd_rice.jpg',
    imageFileId: '6a9aa481ead997d09a3fd767',
    category: 'Lunch',
    active: true
  },
  {
    name: 'Lemon Rice',
    description: 'Tangy aromatic lemon rice tempered with crunchy peanuts, mustard seeds & spices.',
    imageUrl: 'https://ik.imagekit.io/mdkaif472/pollhub/foods/lemon_rice.jpg',
    imageFileId: '6a9aa482ead997d09a3fe717',
    category: 'Lunch',
    active: true
  },
  {
    name: 'Chicken Biryani',
    description: 'Authentic spiced dum biryani with succulent tender chicken and aromatic basmati rice.',
    imageUrl: 'https://ik.imagekit.io/mdkaif472/pollhub/foods/chicken_biryani.jpg',
    imageFileId: '6a9aa484ead997d09a3ff621',
    category: 'Special Lunch',
    active: true
  }
];

export async function seedFoods() {
  console.log('[Seed] Checking food catalog...');
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }

  try {
    const admin = await User.findOne({ role: 'ADMIN' });
    const count = await Food.countDocuments();
    if (count === 0) {
      for (const food of officeFoods) {
        await Food.create({
          ...food,
          createdBy: admin?._id
        });
      }
      console.log(`[Seed] Seeded ${officeFoods.length} authentic office catalog items.`);
    } else {
      console.log(`[Seed] Food catalog already contains ${count} items.`);
    }
  } catch (err) {
    console.error('[Seed Error]', err);
  }
}

if (process.argv[1]?.includes('seedFoods')) {
  seedFoods().then(() => disconnectDB());
}
