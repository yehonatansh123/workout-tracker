const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function apiRequest(path, method, token, body){

    let url = API_BASE_URL + path;

    if (!method)
        method = 'GET';

    let headers;
    if (token){
        headers = {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
    }
    else{
        headers = {
          'Content-type': 'application/json',
        }
    }

    const options = {
        method: method,
        headers: headers,

    };
    
    if (typeof body === 'object' && body !== null && !Array.isArray(body) && Object.prototype.toString.call(body) === '[object Object]'){
        options.body = JSON.stringify(body);
    }
    

    try{
        const response = await fetch(url, options);
        
        let data = null;

        try{
            data = await response.json();
        }
        catch(e){
            // non-JSON response, ignore
        }
        
        

        if (response.ok){
            return { ok:true, status:response.status, data: data, errorMessage:null };
        }
        else
        {
            console.error("Error requesting data", data.error);
            return {ok: false, status: response.status, data: null, errorMessage: data?.error || response.statusText};
        }
    }
    catch(e){
        console.error("Error requesting data", e);
        return {ok: false, status: null, data:null, errorMessage: e.message};
    }
  
}

export { apiRequest };
