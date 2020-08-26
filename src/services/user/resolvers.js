import { oncePerServices, missingService } from '../../common/services/index';


export default oncePerServices(function (services) {
  const { postgres = missingService('postgres') } = services;


  function usersQuery(builderContext) {
    return async function (obj, { filter }, context) {

      const [ where, params ] = makeUsersQueryFilter(filter);

      const users = await postgres.exec({
        statement: `
          select
            user_id as id,
            login,
            name,
            email,
            manager,
            blocked,
            json_extract_path(data::json, 'birthday') as birthday
              from users
              ${where}
        `,
        params,
      });

      // {statement, params}
      return users.rows;
    };
  }

  function userAuthMutation(builderContext) {

    return async function (obj, { input }, context) {
      const {name, password} = input;

      const users = await postgres.exec({
        statement: `
          select
            name
              from users
              where login = $1
                and password_hash = MD5($2)
        `,
        params: [name, password],
      });

      if(users.rows.length === 0) {
        throw new Error("Не чудесненько");
      }

      return "Чудесненько";
    }
  }

  return {
    usersQuery,
    userAuthMutation,
  };
});


function makeUsersQueryFilter(filter) {
  if(filter) {
    const { name, isBlocked, isManager } = filter;
    let params = [];
    let filters = [];

    if(name && name !== "") {
      params.push(name);
      filters.push(`(name like '%'||$1::text||'%' or login like '%'||$1::text||'%')`);
    }
    if(isBlocked) {
      filters.push(`blocked = true`);
    }
    if(isManager) {
      filters.push(`manager = true`);
    }

    const resultFilters = filters.reduce((acc, v) => {
      return (acc === "")? acc + v : acc + " and " + v;
    }, "");
    const where = (resultFilters === "")? "" : " where " + resultFilters;

    return [where, params];
    
  }
  return ["", []];
}