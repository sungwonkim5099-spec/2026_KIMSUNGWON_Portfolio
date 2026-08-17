# 프로젝트 추가 방법

1. 썸네일 이미지를 `assets/works/` 폴더에 넣습니다.

2. `projects.js`에 항목을 하나 추가합니다.

```js
{
  title: "Project Name",
  description: "UX/UI· Responsive Web",
  image: "assets/works/project-name.jpg",
  imageAlt: "Project Name project preview",
  href: "project-name/",
}
```

3. 상세 페이지가 필요한 프로젝트는 `brand-new-day/` 폴더를 복사해서 새 폴더명을 만듭니다.

예시:

```txt
brand-new-day/ -> calmato/
```

4. 아직 상세 페이지가 없으면 `href`를 임시로 홈 섹션에 연결할 수 있습니다.

```js
href: "#visual"
```

5. 외부 링크로 보내고 싶으면 전체 URL을 넣으면 됩니다.

```js
href: "https://example.com"
```

이제 `works/index.html`은 직접 수정하지 않아도 됩니다. 프로젝트 추가/순서 변경은 `projects.js`에서만 관리합니다.
