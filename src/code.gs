/**
 * Throws and logs script exceptions.
 *
 * @param {String} message The exception message
 */

 function sendUserError(message) {
    var cc = DataStudioApp.createCommunityConnector();
    cc.newUserError()
      .setText(message)
      .throwException();
  }
  
  /**
   * function  `isAdminUser()`
   *
   * @returns {Boolean} isAdminUser () should return true if the current user should see debug messages and stack traces.
   * If isAdminUser () returns "false" or is undefined and an error occurs, the user will see a generic error message.
   */
  
  function isAdminUser() {
    return false;
  }
  
  /**
   * function  `getAuthType()`
   *
   * @returns {Object} `AuthType` used by the connector.
   */
  
  //function getAuthType() {
  //  return {type: 'NONE'};
  //}
  
  var cc = DataStudioApp.createCommunityConnector();
  
  function getAuthType() {
    var AuthTypes = cc.AuthType;
    return cc
      .newAuthTypeResponse()
      .setAuthType(AuthTypes.NONE)
      .build();
  }
  
  /**
   * Returns the user configurable options for the connector.
   *
   * Required function for Community Connector.
   *
   * @param   {Object} request  Config request parameters.
   * @returns {Object}          Connector configuration to be displayed to the user.
   */
  
  function getConfig(request) {
    var cc = DataStudioApp.createCommunityConnector();
    var config = cc.getConfig();
  
    config
      .newInfo()
      .setId('instructions')
      .setText('Preencha o formulário para se conectar a uma fonte de dados JSON.');
  
    config
      .newTextInput()
      .setId('url')
      .setName('Insira o URL de uma fonte de dados JSON')
      .setHelpText('e.g. https://my-url.org/json')
      .setPlaceholder('https://my-url.org/json');
    
    config
      .newTextInput()
      .setId('token')
      .setName('Token (Opcional)')
      .setHelpText('Insira o token aqui, se o URL exigir.')
      .setPlaceholder('e.g. 2c4808ace2..');
    
    config
      .newCheckbox()
      .setId('cache')
      .setName('Resposta caché')
      .setHelpText('Útil com grandes conjuntos de dados. A resposta é armazenada em cache por 10 minutos')
      .setAllowOverride(true);
  
    config.setDateRangeRequired(false);
  
    return config.build();
  }
  
  /**
   * Gets UrlFetch response and parses JSON
   *
   * @param   {string} url  The URL to get the data from
   * @returns {Object}      The response object
   */
  
  function fetchJSON(url, token) {
    
    if(!token){
      try {
        var response = UrlFetchApp.fetch(url);
      } catch (e) {
        sendUserError('"' + url + '" returned an error:' + e);
      }
    }else{
      
    // join data for the API
    var baseURL = url+"?access_key="+token;
    var response = UrlFetchApp.fetch(baseURL);
    
    }
  
    try {
      var content = JSON.parse(response);
    } catch (e) {
      sendUserError('Formato JSON no válido. ' + e);
    }
  
    return content;
  }
  
  /**
   * Gets cached response. If the response has not been cached, make
   * the fetchJSON call, then cache and return the response.
   *
   * @param   {string} url  The URL to get the data from
   * @returns {Object}      The response object
   */
  
  function getCachedData(url, token) {
    
    var cacheExpTime = 600;
    var cache = CacheService.getUserCache();
    var cacheKey = url.replace(/[^a-zA-Z0-9]+/g, '');
    var cacheKeyString = cache.get(cacheKey + '.keys');
    var cacheKeys = cacheKeyString !== null ? cacheKeyString.split(',') : [];
    var cacheData = {};
    var content = [];
  
    if (cacheKeyString !== null && cacheKeys.length > 0) {
      cacheData = cache.getAll(cacheKeys);
  
      for (var key in cacheKeys) {
        if (cacheData[cacheKeys[key]] != undefined) {
          content.push(JSON.parse(cacheData[cacheKeys[key]]));
        }
      }
    } else {
      content = fetchJSON(url, token);
  
      for (var key in content) {
        cacheData[cacheKey + '.' + key] = JSON.stringify(content[key]);
      }
  
      cache.putAll(cacheData);
      cache.put(cacheKey + '.keys', Object.keys(cacheData), cacheExpTime);
    }
  
    return content;
  }
  
  /**
   * Fetches data. Either by calling getCachedData or fetchJSON, depending on the cache configuration parameter.
   *
   * @param   {String}  url   The URL to get the data from
   * @param   {Boolean} cache Parameter to determine whether the request should be cached
   * @returns {Object}        The response object
   */
  
  function fetchData(url, token, cache) {
    
    if (!url || !url.match(/^https?:\/\/.+$/g)) {
      sendUserError('"' + url + '" não é um url válido.');
    }
    try {
      var content = cache ? getCachedData(url, token) : fetchJSON(url, token);
    } catch (e) {
      sendUserError(
        'Sua solicitação não pode ser armazenada em cache. As linhas em seu conjunto de dados provavelmente excederão o limite de cache de 100 KB.'
      );
    }
    if (!content) sendUserError('"' + url + '" no devolvió ningún contenido.');
  
    return content;
  }
  
  /**
   * Matches the field value to a semantic
   *
   * @param   {Mixed}   value   The field value
   * @param   {Object}  types   The list of types
   * @return  {string}          The semantic type
   */
  
  function getSemanticType(value, types) {
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return types.NUMBER;
    } else if (value === true || value === false) {
      return types.BOOLEAN;
    } else if (typeof value != 'object' && value != null) {
      if (
        value.match(
          new RegExp(
            /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
          )
        )
      ) {
        return types.URL;
      } else if (!isNaN(Date.parse(value))) {
        return types.YEAR_MONTH_DAY_HOUR;
      }
    }
    return types.TEXT;
  }
  
  /**
   *  Creates the fields
   *
   * @param   {Object}  fields  The list of fields
   * @param   {Object}  types   The list of types
   * @param   {String}  key     The key value of the current element
   * @param   {Mixed}   value   The value of the current element
   */
  
  function createField(fields, types, key, value) {
    var semanticType = getSemanticType(value, types);
    var field =
      semanticType == types.NUMBER ? fields.newMetric() : fields.newDimension();
  
    field.setType(semanticType);
    field.setId(key.replace(/\s/g, '_').toLowerCase());
    field.setName(key);
  }
  
  /**
   * Handles keys for recursive fields
   *
   * @param   {String}  currentKey  The key value of the current element
   * @param   {Mixed}   key         The key value of the parent element
   * @returns {String}  if true
   */
  
  function getElementKey(key, currentKey) {
    if (currentKey == '' || currentKey == null) {
      return;
    }
    if (key != null) {
      return key + '.' + currentKey.replace('.', '_');
    }
    return currentKey.replace('.', '_');
  }
  
  /**
   * Extracts the objects recursive fields and adds it to fields
   *
   * @param   {Object}  fields  The list of fields
   * @param   {Object}  types   The list of types
   * @param   {String}  key     The key value of the current element
   * @param   {Mixed}   value   The value of the current element
   * @param   {boolean} isInline if true
   */
  
  function createFields(fields, types, key, value, isInline) {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      Object.keys(value).forEach(function(currentKey) {
        var elementKey = getElementKey(key, currentKey);
  
        if (isInline && value[currentKey] != null) {
          createFields(fields, types, elementKey, value[currentKey], isInline);
        } else {
          createField(fields, types, currentKey, value);
        }
      });
    } else if (key !== null) {
      createField(fields, types, key, value);
    }
  }
  
  /**
   * Parses first line of content to determine the data schema
   *
   * @param   {Object}  request getSchema/getData request parameter.
   * @param   {Object}  content The content object
   * @return  {Object}           An object with the connector configuration
   */
  
  function getFields(request, content) {
    var cc = DataStudioApp.createCommunityConnector();
    var fields = cc.getFields();
    var types = cc.FieldType;
    var aggregations = cc.AggregationType;
    var isInline = 'inline';
  
    if (!Array.isArray(content)) content = [content];
  
    if (typeof content[0] !== 'object' || content[0] === null) {
      sendUserError('Formato JSON no válido');
    }
    try {
      createFields(fields, types, null, content[0], isInline);
    } catch (e) {
      sendUserError('O formato dos dados de um de seus campos não pode ser identificado.');
    }
    return fields;
  }
  
  /**
   * Returns the schema for the given request.
   *
   * @param   {Object} request Schema request parameters.
   * @returns {Object} Schema for the given request.
   */
  
  function getSchema(request) {
    var content = fetchData(request.configParams.url, request.configParams.token, request.configParams.cache);
    var fields = getFields(request, content).build();
    return {schema: fields};
  }
  
  /**
   * Performs a deep merge of objects and returns new object. Does not modify
   * objects (immutable) and merges arrays via concatenation.
   * Thanks to jhildenbiddle https://stackoverflow.com/users/4903063/jhildenbiddle
   * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
   *
   * @param            Objects to merge
   * @returns {object} New object with merged key/values
   */
  
  function mergeDeep() {
    var objects = Array.prototype.slice.call(arguments);
  
    return objects.reduce(function(prev, obj) {
      Object.keys(obj).forEach(function(key) {
        var pVal = prev[key];
        var oVal = obj[key];
  
        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          prev[key] = pVal.concat.apply(pVal, toConsumableArray(oVal));
        } else if (pVal === Object(pVal) && oVal === Object(oVal)) {
          prev[key] = mergeDeep(pVal, oVal);
        } else {
          prev[key] = oVal;
        }
      });
      return prev;
    }, {});
  }
  
  /**
   *  Converts date strings to YYYYMMDDHH:mm:ss
   *
   * @param   {String} val  Date string
   * @returns {String}      Converted date string
   */
  
  function convertDate(val) {
    var date = new Date(val);
    return (
      date.getUTCFullYear() +
      ('0' + (date.getUTCMonth() + 1)).slice(-2) +
      ('0' + date.getUTCDate()).slice(-2) +
      ('0' + date.getUTCHours()).slice(-2)
    );
  }
  
  /**
   * Validates the row values. Only numbers, boolean, date and strings are allowed
   *
   * @param   {Field} field The field declaration
   * @param   {Mixed} val   The value to validate
   * @returns {Mixed}       Either a string or number
   */
  
  function validateValue(field, val) {
    if (field.getType() == 'YEAR_MONTH_DAY_HOUR') {
      val = convertDate(val);
    }
  
    switch (typeof val) {
      case 'string':
      case 'number':
      case 'boolean':
        return val;
      case 'object':
        return JSON.stringify(val);
    }
    return '';
  }
  
  /**
   * Returns the (nested) values for requested columns
   *
   * @param   {Object} valuePaths       Field name. If nested; field name and parent field name
   * @param   {Object} row              Current content row
   * @returns {Mixed}                   The field values for the columns
   */
  
  function getColumnValue(valuePaths, row) {
    for (var index in valuePaths) {
      var currentPath = valuePaths[index];
  
      if (row[currentPath] === null) {
        return '';
      }
  
      if (row[currentPath] !== undefined) {
        row = row[currentPath];
        continue;
      }
      var keys = Object.keys(row);
  
      for (var index_keys in keys) {
        var key = keys[index_keys].replace(/\s/g, '_').toLowerCase();
        if (key == currentPath) {
          row = row[keys[index_keys]];
          break;
        }
      }
    }
    return row;
  }
  
  /**
   * Returns an object containing only the requested columns
   *
   * @param   {Object} content          The content object
   * @param   {Object} requestedFields  Fields requested in the getData request.
   * @returns {Object}                  An object only containing the requested columns.
   */
  
  function getColumns(content, requestedFields) {
    if (!Array.isArray(content)) content = [content];
  
    return content.map(function(row) {
      var rowValues = [];
  
      requestedFields.asArray().forEach(function(field) {
        var valuePaths = field.getId().split('.');
        var fieldValue = row === null ? '' : getColumnValue(valuePaths, row);
  
        rowValues.push(validateValue(field, fieldValue));
      });
      return {values: rowValues};
    });
  }
  
  /**
   * Returns the tabular data for the given request.
   *
   * @param   {Object} request  Data request parameters.
   * @returns {Object}          Contains the schema and data for the given request.
   */
  
  function getData(request) {
    
    var content = fetchData(request.configParams.url, request.configParams.cache);
    var fields = getFields(request, content);
    var requestedFieldIds = request.fields.map(function(field) {
      return field.name;
    });
    var requestedFields = fields.forIds(requestedFieldIds);
  
    return {
      schema: requestedFields.build(),
      rows: getColumns(content, requestedFields)
    };
  }