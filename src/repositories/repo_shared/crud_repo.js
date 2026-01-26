import { prisma } from '@/lib/db.js';

/**
 * @typedef {{
 *  model: any,
 *  idField: string,
 *  softDeleteField?: string|null
 * }} CrudRepoConfig
 */

/**
 * Generic CRUD repository for Prisma delegate.
 * @param {CrudRepoConfig} cfg
 */
export function createCrudRepository(cfg) {
  const model = cfg.model;
  const idField = cfg.idField;
  const softDeleteField = cfg.softDeleteField ?? null;

  if (!model) throw new Error('createCrudRepository: cfg.model wajib diisi');
  if (!idField) throw new Error('createCrudRepository: cfg.idField wajib diisi');

  const whereId = (id) => ({ [idField]: id });

  return {
    /**
     * @param {{
     *  where?: any,
     *  orderBy?: any,
     *  skip?: number,
     *  take?: number,
     *  include?: any,
     *  select?: any
     * }} args
     */
    async list(args = {}) {
      const { where, orderBy, skip, take, include, select } = args;
      return await model.findMany({
        where: where ?? undefined,
        orderBy: orderBy ?? undefined,
        skip: typeof skip === 'number' ? skip : undefined,
        take: typeof take === 'number' ? take : undefined,
        include: include ?? undefined,
        select: select ?? undefined,
      });
    },

    async count(where) {
      return await model.count({ where: where ?? undefined });
    },

    async findById(id, args = {}) {
      const { include, select } = args;
      return await model.findUnique({
        where: whereId(id),
        include: include ?? undefined,
        select: select ?? undefined,
      });
    },

    async create(data, args = {}) {
      const { include, select } = args;
      return await model.create({
        data,
        include: include ?? undefined,
        select: select ?? undefined,
      });
    },

    async update(id, data, args = {}) {
      const { include, select } = args;
      return await model.update({
        where: whereId(id),
        data,
        include: include ?? undefined,
        select: select ?? undefined,
      });
    },

    async remove(id) {
      if (softDeleteField) {
        return await model.update({
          where: whereId(id),
          data: { [softDeleteField]: new Date() },
        });
      }
      return await model.delete({ where: whereId(id) });
    },

    prisma,
    idField,
    softDeleteField,
  };
}
