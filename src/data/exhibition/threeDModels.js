const tr = (ru, kk, en) => ({ ru, kk, en });

export const exhibitionModels = [
  {
    id: "bory-tastagan",
    src: "/models/exhibition/bory-tastagan.glb",
    sourcePath: "/models/source/bory_tastagan_3d_model.glb",
    poster: "/models/exhibition/posters/bory-tastagan.webp",
    title: tr(
      "Модель объекта наследия Боры Тастаган",
      "Бөрітостаған мұра нысанының моделі",
      "Bory Tastagan heritage model"
    ),
    description: tr(
      "Локальная интерактивная модель для демонстрации объекта наследия.",
      "Мұра нысанын көрсетуге арналған жергілікті интерактивті модель.",
      "A local interactive model for presenting the heritage object."
    ),
    fileSizeBytes: 1365176,
    optimized: true,
    verificationStatus: "reviewed",
    cacheVersion: "v1",
    reconstructionNotice: tr(
      "Демонстрационная 3D-модель объекта; она не является реконструкцией исторической территории.",
      "Нысанның демонстрациялық 3D-моделі; бұл тарихи аумақтың реконструкциясы емес.",
      "A demonstration 3D model of the object; it is not a reconstruction of historical territory."
    ),
  },
];

export const primaryExhibitionModel = exhibitionModels[0];

export const getExhibitionModel = (id) =>
  exhibitionModels.find((model) => model.id === id) || null;

