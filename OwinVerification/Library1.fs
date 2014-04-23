namespace OwinVerification

type IOwinVerification = 
    abstract member VerifyEnvironment: OwinRuleset.OwinEnv -> OwinRuleset.OwinCompliance array

    
