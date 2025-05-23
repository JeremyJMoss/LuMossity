import LoginForm from "@/components/forms/LoginForm";

const Login = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-bold text-moss-dark">Login to LuMossity</h1>
      <p className="text-xl text-olive">
        Headless by Design, Rooted in Growth. 🌱
      </p>
      <LoginForm/>
    </div>
  )
}

export default Login;