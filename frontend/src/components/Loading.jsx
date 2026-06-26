const GREEN='#6B8F71';

function Loading(){
    return(
        <div className="min-h-screen flex items-center justify-center" style={{background:'#F8F9FA'}}>
            <div className="flex flex-col items-center gap-3">
                <div className="text-4xl animate-spin">🥐</div>
                <p className="text-sm font-medium" style={{color:GREEN}}>Se încarcă...</p>
            </div>
        </div>
    );
}

export default Loading;