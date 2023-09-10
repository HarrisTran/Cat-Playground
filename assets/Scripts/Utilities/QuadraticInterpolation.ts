import { Vec3 } from "cc";

export function getQuadLerper(p0: Vec3, p1: Vec3, p2: Vec3): (number) => number
{
    p0 = p0.clone();
    p1 = p1.clone();
    p2 = p2.clone();
    let l0 = (x) => ((x - p1.x) * (x - p2.x)) / ((p0.x - p1.x) * (p0.x - p2.x));
    let l1 = (x) => ((x - p0.x) * (x - p2.x)) / ((p1.x - p0.x) * (p1.x - p2.x));
    let l2 = (x) => ((x - p0.x) * (x - p1.x)) / ((p2.x - p0.x) * (p2.x - p1.x));
    let p = (x) => p0.y * l0(x) + p1.y * l1(x) + p2.y * l2(x);

    return p;
}