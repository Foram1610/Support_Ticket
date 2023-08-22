const { Op } = require("sequelize")
const { includeFields } = require('../config/includeFields')

async function IncludeRecursive(array) {
    try {
        let fields = [], as = '', nestedInclude = []
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            for (let j = 0; j < includeFields.length; j++) {
                const element1 = includeFields[j];
                if (element1.field === element.path) {
                    if (element1.as) {
                        as = element1.as
                    }
                    if (element.include && element.include.length !== 0) {
                        nestedInclude = await IncludeRecursive(element.include)
                    }

                    fields.push({ model: element1.model, as: as, attributes: element.fieldName, include: nestedInclude })
                    j = includeFields.length + 1
                }
            }
        }
        return fields
    }
    catch (error) {
        return error.message
    }
}

async function getAllData(bodyData, model) {
    try {
        let options = {}, limit = null, offset = null, pageNo = 0, perPage = 0,
            search = null, query = {}, include = [], sortBy = [], attributes = {}
        if (bodyData.hasOwnProperty('search')) {
            search = bodyData.search;
            delete bodyData.search;
        }
        if (bodyData.hasOwnProperty('options')) {
            options = bodyData.options
            if (options.hasOwnProperty('include')) {
                include = options.include
            }
            if (options.hasOwnProperty('sortBy')) {
                sortBy = options.sortBy
            }
            if (options.hasOwnProperty('attributes')) {
                attributes = options.attributes
            }
        }
        if (bodyData.hasOwnProperty('query')) {
            query = bodyData.query
        }
        if (search && search.hasOwnProperty('keys') && Array.isArray(search.keys) && search.keys.length && search.value !== "") {
            let keyword = []
            for (let keyIndex = 0; keyIndex < search.keys.length; keyIndex++) {
                const valueArr = search.value.split(' ')
                const key = search.keys[keyIndex];
                for (let valueIndex = 0; valueIndex < valueArr.length; valueIndex++) {
                    const searchValue = valueArr[valueIndex];
                    keyword.push({ [key]: { [Op.iLike]: `%${searchValue}%` } })
                }
            }
            query[Op.or] = keyword;
        }
        if (include) {
            include = await IncludeRecursive(include)
        }
        if (options.paginate === true) {
            limit = parseInt(options.limit)
            offset = (options.pageNo - 1) * limit
            pageNo = options.pageNo
            perPage = options.limit
        }

        const data = await model.findAll({
            where: {
                [Op.and]: [query]
            },
            attributes: options.attributes,
            include: include,
            limit: limit,
            offset: offset,
            order: options.sortBy
        })


        const data1 = await model.findAll({
            where: {
                [Op.and]: [query]
            }
        })
        const count = data1.length

        const Pagination = {
            TotalData: count,
            PageNo: pageNo,
            Limit: perPage,
            Offset: offset
        }
        return ({ data: data, paginate: Pagination })
    } catch (error) {
        return error.message
    }
}

module.exports = { getAllData }